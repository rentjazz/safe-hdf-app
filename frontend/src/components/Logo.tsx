export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fond */}
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      
      {/* Coffre-fort */}
      <rect x="25" y="30" width="50" height="45" rx="4" fill="#1e293b" stroke="#991b1b" strokeWidth="3"/>
      
      {/* Cadran du coffre */}
      <circle cx="50" cy="52.5" r="12" fill="#0f172a" stroke="#991b1b" strokeWidth="2"/>
      <circle cx="50" cy="52.5" r="4" fill="#991b1b"/>
      
      {/* Barres du coffre */}
      <rect x="35" y="40" width="8" height="4" rx="1" fill="#991b1b"/>
      <rect x="57" y="40" width="8" height="4" rx="1" fill="#991b1b"/>
      
      {/* Stéthoscope - partie supérieure */}
      <path 
        d="M50 30 C50 20, 30 20, 30 35 C30 45, 35 50, 40 48" 
        stroke="#0f172a" 
        strokeWidth="4" 
        strokeLinecap="round"
        fill="none"
      />
      <path 
        d="M50 30 C50 20, 70 20, 70 35 C70 45, 65 50, 60 48" 
        stroke="#0f172a" 
        strokeWidth="4" 
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Stéthoscope - partie colorée */}
      <path 
        d="M50 30 C50 18, 28 18, 28 35 C28 47, 34 52, 40 50" 
        stroke="#991b1b" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        fill="none"
      />
      <path 
        d="M50 30 C50 18, 72 18, 72 35 C72 47, 66 52, 60 50" 
        stroke="#991b1b" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo className="w-10 h-10" />
      <div className="flex flex-col">
        <span className="text-xl font-bold text-white tracking-tight">
          <span className="text-white">SAFE</span>
          <span className="text-slate-400 font-normal"> H.D.F</span>
        </span>
      </div>
    </div>
  );
}