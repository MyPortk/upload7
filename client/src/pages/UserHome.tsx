import { useQuery } from "@tanstack/react-query";
import { Package, ArrowDown, Camera, Mic, Lightbulb, Box, Wrench, HardDrive, Calendar, BarChart3 } from "lucide-react";
import type { Language } from "@/lib/translations";
import { api, type CategoryWithCounts } from "@/lib/api";

import shape1 from "@assets/pixy_design/shapes/1.png";
import shape2 from "@assets/pixy_design/shapes/2.png";
import shape3 from "@assets/pixy_design/shapes/3.png";
import shape4 from "@assets/pixy_design/shapes/4.png";

interface UserHomeProps {
  userName: string;
  userRole: string;
  userId: string;
  currentLanguage: Language;
  onNavigateToInventory: () => void;
  onNavigateToReservations: () => void;
  onNavigateToReports: () => void;
  onSelectCategory: (categoryId: string) => void;
}

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
  onSelectCategory
}: UserHomeProps) {
  const isArabic = currentLanguage === 'ar';

  const { data: categories = [] } = useQuery<CategoryWithCounts[]>({
    queryKey: ['/api/categories', 'equipment'],
    queryFn: () => api.categories.getAll(true)
  });

  const scrollToCategories = () => {
    const categoriesSection = document.getElementById('categories-section');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const quickActions = [
    {
      title: isArabic ? 'تصفح المخزون' : 'Browse Inventory',
      subtitle: isArabic ? 'جميع المعدات' : 'All Equipment',
      icon: Package,
      onClick: onNavigateToInventory,
      color: 'bg-primary'
    },
    {
      title: isArabic ? 'حجوزاتي' : 'My Reservations',
      subtitle: isArabic ? 'إدارة الحجوزات' : 'Manage Bookings',
      icon: Calendar,
      onClick: onNavigateToReservations,
      color: 'bg-secondary'
    },
    {
      title: isArabic ? 'التقارير' : 'Reports',
      subtitle: isArabic ? 'عرض البيانات' : 'View Analytics',
      icon: BarChart3,
      onClick: onNavigateToReports,
      color: 'bg-primary'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mil-hero-1 relative min-h-screen overflow-visible">
        <div className="mil-shapes absolute inset-0 pointer-events-none">
          <div 
            className="absolute animate-levitate-lg" 
            style={{ bottom: '10%', left: '5%', width: '15vw', animationDelay: '1s' }}
          >
            <img src={shape1} alt="" className="w-full opacity-80" />
          </div>
          <div 
            className="absolute animate-levitate-lg" 
            style={{ top: '15%', left: '10%', width: '12vw', animationDelay: '0.2s' }}
          >
            <img src={shape2} alt="" className="w-full opacity-80" style={{ transform: 'rotate(-70deg)' }} />
          </div>
          <div 
            className="absolute animate-levitate-lg" 
            style={{ bottom: '20%', right: '5%', width: '18vw', animationDelay: '0.6s' }}
          >
            <img src={shape3} alt="" className="w-full opacity-80" />
          </div>
        </div>

        <div className="mil-hero-text w-full min-h-screen flex flex-col items-center justify-center text-center relative z-10 px-6">
          <div className="mil-text-pad"></div>
          
          <div className="mil-mb15">
            <Package className="w-8 h-8 text-secondary" />
          </div>
          
          <p className="mil-stylized mil-m2 mil-mb30">
            {isArabic ? 'مرحباً' : 'Welcome'},
          </p>
          
          <p className="mil-stylized mil-a2 mil-mb30" data-testid="text-user-welcome">
            {userName}!
          </p>
          
          <div className="relative mil-mb30">
            <div 
              className="mil-s-4 absolute animate-levitate-sm pointer-events-none hidden md:block" 
              style={{ top: '-50%', left: '-25%', width: '80px', animationDelay: '0.8s' }}
            >
              <img src={shape4} alt="" className="w-full opacity-80" style={{ transform: 'rotate(-90deg)' }} />
            </div>
            
            <h1 className="mil-display1 text-foreground" data-testid="text-hero-title">
              <RubberText text={isArabic ? 'المخزون' : 'INVENTORY'} />
            </h1>
            
            <div 
              className="mil-s-5 absolute animate-levitate-sm pointer-events-none hidden md:block" 
              style={{ bottom: '20%', right: '-20%', width: '100px', animationDelay: '0.4s' }}
            >
              <img src={shape1} alt="" className="w-full opacity-80" />
            </div>
          </div>
          
          <h2 className="mil-head2 mil-m2 mil-mb60">
            {isArabic ? 'نظام إدارة الأصول الكامل' : 'Complete asset management system'}
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
                  {isArabic ? 'التصنيفات - التصنيفات - ' : 'categories - categories - '}
                </textPath>
              </text>
            </svg>
            <div className="mil-scroll-inner">
              <ArrowDown className="w-5 h-5 text-primary-foreground animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      <div id="categories-section" className="py-24 px-6 lg:px-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <h2 className="mil-head1 mil-up" data-testid="text-categories-title">
                {isArabic ? 'التصنيفات' : 'Categories'} <span className="mil-a2">{isArabic ? 'المتاحة' : 'Available'}</span>
              </h2>
            </div>
            <div>
              <button 
                onClick={onNavigateToInventory}
                className="mil-stylized mil-a2 flex items-center gap-2 hover:gap-3 transition-all"
                data-testid="link-view-all"
              >
                {isArabic ? 'عرض الكل' : 'View all'}
                <span className="text-lg">&rarr;</span>
              </button>
            </div>
          </div>

          <div className="mil-portfolio-grid mb-16" data-testid="categories-grid">
            {categories.slice(0, 6).map((category) => {
              const IconComponent = categoryIcons[category.name] || Box;
              return (
                <div 
                  key={category.id}
                  className="mil-portfolio-item group"
                  onClick={() => onSelectCategory(category.id)}
                  data-testid={`card-category-${category.id}`}
                >
                  <div className="aspect-[4/3] bg-card border border-border rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="mil-head4 mb-2">{category.name}</h3>
                      <p className="mil-text-sm mil-m2">
                        {category.totalCount} {isArabic ? 'عنصر' : 'items'}
                      </p>
                      <p className="mil-text-sm mil-a2">
                        {category.availableCount} {isArabic ? 'متاح' : 'available'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-16">
            <p className="mil-stylized mil-m2 mb-8">{isArabic ? 'إجراءات سريعة' : 'Quick Actions'}</p>
            <div className="grid md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <div 
                  key={index}
                  className="group p-8 rounded-xl bg-card border border-border hover-elevate transition-all duration-300 cursor-pointer"
                  onClick={action.onClick}
                  data-testid={`card-action-${index}`}
                >
                  <div className={`w-14 h-14 ${action.color} rounded-full flex items-center justify-center mb-6`}>
                    <action.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="mil-head3 mb-2">{action.title}</h3>
                  <p className="mil-text-md mil-m2">{action.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-24 flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-card rounded-xl border border-border">
            <div>
              <p className="mil-text-md mil-m1 mb-2">
                {isArabic ? 'ابدأ بتصفح المعدات المتاحة الآن!' : 'Start browsing available equipment now!'}
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

      <footer className="py-12 px-6 lg:px-12 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="mil-text-sm mil-m2">
              {isArabic ? '© 2024. جميع الحقوق محفوظة.' : '© 2024. All rights reserved.'}
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
