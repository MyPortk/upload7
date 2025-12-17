import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowDown, Camera, Mic, Lightbulb, Box, Wrench, HardDrive, Calendar, BarChart3, Home, ClipboardList, FileBarChart, LogOut } from "lucide-react";
import type { Language } from "@/lib/translations";
import { api, type CategoryWithCounts } from "@/lib/api";

import shape1 from "@assets/pixy_design/shapes/1.png";
import shape2 from "@assets/pixy_design/shapes/2.png";
import shape3 from "@assets/pixy_design/shapes/3.png";
import shape4 from "@assets/pixy_design/shapes/4.png";

import demoImg1 from "@assets/pixy_design/demo/1.jpg";
import demoImg2 from "@assets/pixy_design/demo/2.jpg";
import demoImg3 from "@assets/pixy_design/demo/3.jpg";
import demoImg4 from "@assets/pixy_design/demo/4.jpg";
import demoImg5 from "@assets/pixy_design/demo/5.jpg";
import demoImg6 from "@assets/pixy_design/demo/6.jpg";

interface UserHomeProps {
  userName: string;
  userRole: string;
  userId: string;
  currentLanguage: Language;
  onNavigateToInventory: () => void;
  onNavigateToReservations: () => void;
  onNavigateToReports: () => void;
  onSelectCategory: (categoryId: string) => void;
  onLogout?: () => void;
}

const categoryImages: string[] = [demoImg1, demoImg2, demoImg3, demoImg4, demoImg5, demoImg6];

const categoryIcons: Record<string, any> = {
  'Cameras': Camera,
  'Audio Equipment': Mic,
  'Lighting': Lightbulb,
  'Grips & Stabilization': Wrench,
  'Storage Devices': HardDrive,
};

function RubberText({ text }: { text: string }) {
  return (
    <span className="mil-rubber">
      {text.split('').map((char, index) => (
        <span 
          key={index} 
          className="mil-letter-span"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

export default function UserHome({ 
  userName, 
  userRole, 
  userId,
  currentLanguage, 
  onNavigateToInventory,
  onNavigateToReservations,
  onNavigateToReports,
  onSelectCategory,
  onLogout
}: UserHomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const isArabic = currentLanguage === 'ar';

  const { data: categories = [] } = useQuery<CategoryWithCounts[]>({
    queryKey: ['/api/categories', 'equipment'],
    queryFn: () => api.categories.getAll(true)
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCategories = () => {
    const categoriesSection = document.getElementById('categories-section');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const menuItems = [
    { title: isArabic ? 'الرئيسية' : 'Home', icon: Home, onClick: () => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, active: true },
    { title: isArabic ? 'المخزون' : 'Inventory', icon: Package, onClick: () => { setMenuOpen(false); onNavigateToInventory(); } },
    { title: isArabic ? 'الحجوزات' : 'Reservations', icon: ClipboardList, onClick: () => { setMenuOpen(false); onNavigateToReservations(); } },
    { title: isArabic ? 'التقارير' : 'Reports', icon: FileBarChart, onClick: () => { setMenuOpen(false); onNavigateToReports(); } },
  ];

  return (
    <div className="mil-page-wrapper min-h-screen bg-background relative" style={{ overflow: 'visible' }}>
      
      <div className="mil-progress-track hidden md:block">
        <div className="mil-progress" style={{ height: `${scrollProgress}%` }} />
      </div>

      <div className="mil-top-panel">
        <div className="mil-left-side">
          <a href="#top" className="mil-logo" data-testid="link-logo">
            <Package className="w-6 h-6 text-secondary" />
            <span>{isArabic ? 'المخزون' : 'Inventory'}</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="mil-tp-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="button-menu-toggle"
          >
            <div className={`mil-menu-btn ${menuOpen ? 'active' : ''}`}>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className={`mil-menu-overlay ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className={`mil-menu-frame ${menuOpen ? 'active' : ''}`}>
        <div className="mil-menu-window h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <ul className="mil-main-menu">
              {menuItems.map((item, index) => (
                <li key={index} className={item.active ? 'active' : ''}>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); item.onClick(); }}
                    data-testid={`menu-item-${index}`}
                    className="flex items-center gap-3"
                  >
                    <item.icon className="w-6 h-6" />
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-10 border-t border-border">
            <div className="mb-6">
              <p className="mil-stylized mil-m2 mb-2">{isArabic ? 'مسجل الدخول كـ' : 'Logged in as'}</p>
              <p className="mil-head4 text-foreground">{userName}</p>
              <p className="mil-text-sm mil-m2 capitalize">{userRole}</p>
            </div>
            {onLogout && (
              <button 
                onClick={() => { setMenuOpen(false); onLogout(); }}
                className="flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="mil-stylized">{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mil-hero-1 relative min-h-screen overflow-visible" id="top">
        <div className="mil-shapes absolute inset-0 pointer-events-none">
          <div 
            className="mil-s-1 absolute animate-levitate-lg" 
            style={{ top: '15%', left: '8%', width: '12vw', maxWidth: '150px', animationDelay: '0.2s' }}
          >
            <img src={shape2} alt="" className="w-full opacity-80" style={{ transform: 'rotate(-70deg)' }} />
          </div>
          <div 
            className="mil-s-2 absolute animate-levitate-lg" 
            style={{ bottom: '25%', left: '5%', width: '15vw', maxWidth: '180px', animationDelay: '1s' }}
          >
            <img src={shape1} alt="" className="w-full opacity-80" />
          </div>
          <div 
            className="mil-s-3 absolute animate-levitate-lg" 
            style={{ bottom: '15%', right: '8%', width: '18vw', maxWidth: '220px', animationDelay: '0.6s' }}
          >
            <img src={shape3} alt="" className="w-full opacity-80" />
          </div>
        </div>

        <div className="mil-hero-text w-full min-h-screen flex flex-col items-center justify-center text-center relative z-10 px-6">
          <div className="mil-text-pad"></div>
          
          <div className="mil-mb15">
            <Package className="w-10 h-10 text-secondary" />
          </div>
          
          <p className="mil-stylized mil-m2 mil-mb60" data-testid="text-welcome-label">
            {isArabic ? 'مرحباً!' : 'Welcome!'}
          </p>
          
          <div className="relative mil-mb30">
            <div 
              className="mil-s-4 absolute animate-levitate-sm pointer-events-none hidden md:block" 
              style={{ top: '-30%', left: '-20%', width: '80px', animationDelay: '0.8s' }}
            >
              <img src={shape4} alt="" className="w-full opacity-80" style={{ transform: 'rotate(-90deg)' }} />
            </div>
            
            <h1 className="mil-display1 text-foreground" data-testid="text-hero-title">
              <RubberText text={isArabic ? 'المخزون' : 'Inventory'} />
            </h1>
            
            <div 
              className="mil-s-5 absolute animate-levitate-sm pointer-events-none hidden md:block" 
              style={{ bottom: '10%', right: '-15%', width: '60px', animationDelay: '0.4s' }}
            >
              <img src={shape1} alt="" className="w-full opacity-80" />
            </div>
          </div>
          
          <h2 className="mil-head2 mil-m2 mil-mb60" data-testid="text-hero-subtitle">
            {isArabic ? 'نظام إدارة الأصول' : 'Asset Management System'}
          </h2>
          
          <div 
            className="mil-scroll-indicator group"
            onClick={scrollToCategories}
            data-testid="button-scroll-to-categories"
          >
            <svg className="mil-scroll-text" viewBox="0 0 120 120">
              <defs>
                <path id="circle-path" d="M 60, 60 m -45, 0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0"/>
              </defs>
              <text className="fill-current text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                <textPath href="#circle-path">
                  {isArabic ? 'انتقل للأسفل - انتقل للأسفل - ' : 'scroll down - scroll down - '}
                </textPath>
              </text>
            </svg>
            <div className="mil-scroll-inner">
              <ArrowDown className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div id="categories-section" className="py-24 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <h2 className="mil-head1 mil-up" data-testid="text-categories-title">
                {isArabic ? 'تصفح' : 'Browse'} <span className="mil-a2">{isArabic ? 'التصنيفات' : 'Categories'}</span>
              </h2>
            </div>
            <div>
              <button 
                onClick={onNavigateToInventory}
                className="mil-stylized mil-a2 flex items-center gap-2 hover:gap-3 transition-all group"
                data-testid="link-view-all"
              >
                {isArabic ? 'عرض الكل' : 'View all inventory'}
                <span className="text-lg group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16" data-testid="categories-grid">
            {categories.slice(0, 6).map((category, index) => {
              const IconComponent = categoryIcons[category.name] || Box;
              const imageUrl = categoryImages[index % categoryImages.length];
              
              return (
                <div 
                  key={category.id}
                  className="mil-portfolio-item group relative overflow-hidden rounded-lg cursor-pointer"
                  onClick={() => onSelectCategory(category.id)}
                  data-testid={`card-category-${category.id}`}
                >
                  <img 
                    src={imageUrl} 
                    alt={category.name}
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="mil-portfolio-overlay">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="mil-head4 text-white">{category.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="mil-text-sm text-white/80">
                        {category.totalCount} {isArabic ? 'عنصر' : 'items'}
                      </p>
                      <span className="text-white/40">|</span>
                      <p className="mil-text-sm text-primary">
                        {category.availableCount} {isArabic ? 'متاح' : 'available'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-card rounded-xl border border-border">
            <div>
              <p className="mil-text-md text-foreground mb-2" data-testid="text-cta-message">
                {isArabic ? 'ابدأ بتصفح المعدات المتاحة الآن!' : 'Start creating your equipment bookings right now!'}
              </p>
              <p className="mil-text-sm mil-m2">
                {categories.length} {isArabic ? 'تصنيف' : 'categories'} | {categories.reduce((acc, c) => acc + c.totalCount, 0)} {isArabic ? 'عنصر' : 'total items'}
              </p>
            </div>
            <button 
              onClick={onNavigateToInventory}
              className="mil-btn mil-a2"
              data-testid="button-browse-inventory"
            >
              {isArabic ? 'تصفح المخزون' : 'Browse Inventory'}
            </button>
          </div>
        </div>
      </div>

      <div className="py-16 px-6 lg:px-12 border-t border-border">
        <div className="container mx-auto max-w-7xl">
          <p className="mil-stylized mil-m2 mb-8">{isArabic ? 'إجراءات سريعة' : 'Quick Actions'}</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div 
              className="group p-8 rounded-xl bg-card border border-border hover-elevate transition-all duration-300 cursor-pointer"
              onClick={onNavigateToInventory}
              data-testid="card-action-inventory"
            >
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mb-6">
                <Package className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="mil-head3 mb-2">{isArabic ? 'تصفح المخزون' : 'Browse Inventory'}</h3>
              <p className="mil-text-md mil-m2">{isArabic ? 'جميع المعدات' : 'All Equipment'}</p>
            </div>
            
            <div 
              className="group p-8 rounded-xl bg-card border border-border hover-elevate transition-all duration-300 cursor-pointer"
              onClick={onNavigateToReservations}
              data-testid="card-action-reservations"
            >
              <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="mil-head3 mb-2">{isArabic ? 'حجوزاتي' : 'My Reservations'}</h3>
              <p className="mil-text-md mil-m2">{isArabic ? 'إدارة الحجوزات' : 'Manage Bookings'}</p>
            </div>
            
            <div 
              className="group p-8 rounded-xl bg-card border border-border hover-elevate transition-all duration-300 cursor-pointer"
              onClick={onNavigateToReports}
              data-testid="card-action-reports"
            >
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="mil-head3 mb-2">{isArabic ? 'التقارير' : 'Reports'}</h3>
              <p className="mil-text-md mil-m2">{isArabic ? 'عرض البيانات' : 'View Analytics'}</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-12 px-6 lg:px-12 border-t border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="mil-text-sm mil-m2">
              {isArabic ? '© 2024. جميع الحقوق محفوظة.' : '2024. All rights reserved.'}
            </p>
            <p className="mil-text-sm mil-m2">
              {isArabic ? 'نظام إدارة المخزون' : 'Inventory Management System'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
