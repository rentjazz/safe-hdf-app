from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.schemas import StockItem, StockItemCreate, StockItemUpdate
from app.database import StockItem as StockItemModel

router = APIRouter(prefix="/stock", tags=["stock"])

@router.get("/", response_model=List[StockItem])
def get_stock_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    location: Optional[str] = None,
    low_stock: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(StockItemModel)
    
    if category:
        query = query.filter(StockItemModel.category.ilike(f"%{category}%"))
    if location:
        query = query.filter(StockItemModel.location.ilike(f"%{location}%"))
    if search:
        query = query.filter(
            (StockItemModel.name.ilike(f"%{search}%")) |
            (StockItemModel.barcode.ilike(f"%{search}%"))
        )
    if low_stock:
        query = query.filter(StockItemModel.quantity <= StockItemModel.min_threshold)
    
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=StockItem)
def create_stock_item(item: StockItemCreate, db: Session = Depends(get_db)):
    db_item = StockItemModel(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/{item_id}", response_model=StockItem)
def get_stock_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(StockItemModel).filter(StockItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    return item

@router.put("/{item_id}", response_model=StockItem)
def update_stock_item(item_id: int, item_update: StockItemUpdate, db: Session = Depends(get_db)):
    item = db.query(StockItemModel).filter(StockItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    from datetime import datetime
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_stock_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(StockItemModel).filter(StockItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Stock item deleted successfully"}

@router.get("/stats/low-stock")
def get_low_stock_items(db: Session = Depends(get_db)):
    items = db.query(StockItemModel).filter(
        StockItemModel.quantity <= StockItemModel.min_threshold
    ).all()
    return items

@router.get("/stats/by-category")
def get_stock_by_category(db: Session = Depends(get_db)):
    from sqlalchemy import func
    result = db.query(StockItemModel.category, func.count(StockItemModel.id)).group_by(StockItemModel.category).all()
    return {category or "Non catégorisé": count for category, count in result}

@router.post("/{item_id}/adjust-quantity")
def adjust_quantity(item_id: int, adjustment: float, db: Session = Depends(get_db)):
    item = db.query(StockItemModel).filter(StockItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    item.quantity += adjustment
    if item.quantity < 0:
        item.quantity = 0
    
    from datetime import datetime
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item