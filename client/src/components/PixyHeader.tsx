import { Package } from "lucide-react";

interface PixyHeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export default function PixyHeader({ isMenuOpen, onMenuToggle }: PixyHeaderProps) {
  return (
    <div className="mil-top-panel" data-testid="header-pixy">
      <a href="#" className="mil-logo" data-testid="link-logo">
        <Package className="w-7 h-7" />
        <span>Inventory</span>
      </a>
      
      <div 
        className={`mil-tp-btn ${isMenuOpen ? 'active' : ''}`}
        onClick={onMenuToggle}
        data-testid="button-menu-toggle"
      >
        <div className={`mil-menu-btn ${isMenuOpen ? 'active' : ''}`}>
          <span></span>
        </div>
      </div>
    </div>
  );
}
