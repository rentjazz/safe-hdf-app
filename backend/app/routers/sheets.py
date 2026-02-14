from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import requests
from app.database import get_db, StockItem
from app.models.schemas import StockItem as StockItemSchema

router = APIRouter(prefix="/sheets", tags=["google_sheets"])

# Configuration Google Sheets
GOOGLE_SHEETS_API_KEY = os.getenv("GOOGLE_SHEETS_API_KEY", "")
SHEET_ID = "1qmSveh_54AGMoLNqLEbhvc53t8ul6ctR1L7jauD0qUo"
SHEET_RANGE = "Stock!A:Z"  # Ajuste selon ton tableau

@router.get("/sync-stock")
def sync_stock_from_sheets(db: Session = Depends(get_db)):
    """
    Synchronise le stock depuis Google Sheets.
    Nécessite une clé API Google Sheets configurée.
    """
    if not GOOGLE_SHEETS_API_KEY:
        raise HTTPException(
            status_code=400, 
            detail="Google Sheets API key not configured. Set GOOGLE_SHEETS_API_KEY environment variable."
        )
    
    try:
        # Appel à l'API Google Sheets
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/{SHEET_RANGE}"
        params = {"key": GOOGLE_SHEETS_API_KEY}
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        values = data.get("values", [])
        
        if not values or len(values) < 2:
            return {"message": "No data found in sheet", "synced": 0}
        
        # Première ligne = headers
        headers = values[0]
        
        # Mapping des colonnes (adapte selon ton tableau)
        # Supposons: Nom | Référence | Quantité | Seuil alerte | Emplacement | Fournisseur
        synced_count = 0
        
        for row in values[1:]:
            if len(row) < 2:
                continue
                
            name = row[0] if len(row) > 0 else ""
            reference = row[1] if len(row) > 1 else ""
            quantity = float(row[2]) if len(row) > 2 and row[2] else 0
            min_threshold = float(row[3]) if len(row) > 3 and row[3] else 10
            location = row[4] if len(row) > 4 else ""
            supplier = row[5] if len(row) > 5 else ""
            
            if not name:
                continue
            
            # Chercher si l'article existe déjà
            existing = db.query(StockItem).filter(
                StockItem.barcode == reference
            ).first()
            
            if existing:
                # Mettre à jour
                existing.name = name
                existing.quantity = quantity
                existing.min_threshold = min_threshold
                existing.location = location
                existing.supplier = supplier
                existing.updated_at = datetime.utcnow()
            else:
                # Créer nouvel article
                new_item = StockItem(
                    name=name,
                    barcode=reference,
                    quantity=quantity,
                    min_threshold=min_threshold,
                    location=location,
                    supplier=supplier,
                    unit="unit"
                )
                db.add(new_item)
                synced_count += 1
        
        db.commit()
        
        return {
            "message": "Stock synchronized successfully",
            "synced": synced_count,
            "total_rows": len(values) - 1
        }
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching from Google Sheets: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync error: {str(e)}")

@router.get("/stock-with-alerts")
def get_stock_with_alerts(db: Session = Depends(get_db)):
    """
    Récupère le stock avec les alertes pour n8n.
    Retourne uniquement les articles en dessous du seuil.
    """
    low_stock_items = db.query(StockItem).filter(
        StockItem.quantity <= StockItem.min_threshold
    ).all()
    
    return {
        "alert_count": len(low_stock_items),
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "min_threshold": item.min_threshold,
                "location": item.location,
                "supplier": item.supplier
            }
            for item in low_stock_items
        ]
    }

@router.post("/webhook/low-stock-alert")
def trigger_low_stock_alert(db: Session = Depends(get_db)):
    """
    Endpoint webhook pour n8n.
    Vérifie les stocks bas et retourne les alertes.
    """
    return get_stock_with_alerts(db)