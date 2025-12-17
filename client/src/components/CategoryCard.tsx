import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { useTranslation, type Language } from "@/lib/translations";

interface CategoryCardProps {
  name: string;
  image: string;
  totalCount: number;
  availableCount: number;
  subTypes: readonly string[];
  onClick?: () => void;
  language?: Language;
  compactMode?: boolean;
}

export default function CategoryCard({
  name,
  image,
  totalCount,
  availableCount,
  subTypes,
  onClick,
  language = 'en',
  compactMode = false
}: CategoryCardProps) {
  const t = useTranslation(language);
  const [showTags, setShowTags] = useState<boolean>(false);
  
  const translatedName = t(name as any) || name;
  const translatedSubTypes = subTypes.map(subType => t(subType as any) || subType);
  const categoryLabel = translatedSubTypes.length > 0 ? translatedSubTypes[0] : t('category');

  // Compact mode for user role - matching admin theme
  if (compactMode) {
    return (
      <div 
        className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[0_0_40px_rgba(55,204,141,0.5)]"
        onClick={onClick}
        data-testid={`card-category-${name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Image section */}
          <div 
            className="h-[220px] bg-cover bg-center relative"
            style={{ backgroundImage: `url(${image})` }}
          >
            <div className="absolute top-3 left-3 flex items-center gap-1">
              <Badge 
                className="bg-primary text-primary-foreground"
                data-testid={`badge-available-${name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {availableCount} {t('available')}
              </Badge>
              
              {translatedSubTypes.length > 0 && (
                <div className="relative">
                  <div
                    className="cursor-pointer p-1 hover:bg-white/20 rounded transition-colors"
                    onMouseEnter={() => setShowTags(true)}
                    onMouseLeave={() => setShowTags(false)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronDown className="w-4 h-4 text-white" />
                  </div>
                  
                  {showTags && (
                    <div 
                      className="absolute top-full left-0 mt-2 p-3 bg-popover border border-popover-border rounded-md shadow-xl z-50 min-w-[200px]"
                      onMouseEnter={() => setShowTags(true)}
                      onMouseLeave={() => setShowTags(false)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {translatedSubTypes.map((subType, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary"
                            className="bg-primary text-primary-foreground text-[11px] px-2 py-0.5"
                          >
                            {subType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Content section */}
          <div className="p-5">
            <h3 className="text-lg font-bold mb-2 text-card-foreground">
              {translatedName}
            </h3>
            
            <p className="text-sm text-muted-foreground" data-testid={`text-category-count-${name.toLowerCase().replace(/\s+/g, '-')}`}>
              {totalCount} {t('totalItems')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Original mode for admin/developer - shows tags inline
  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[0_0_40px_rgba(55,204,141,0.5)]"
      onClick={onClick}
      data-testid={`card-category-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div 
        className="h-[220px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${image})` }}
      >
        <Badge 
          className="absolute top-3 left-3 bg-primary text-primary-foreground"
          data-testid={`badge-available-${name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {availableCount} {t('available')}
        </Badge>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold mb-2 text-card-foreground" data-testid={`text-category-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
          {translatedName}
        </h3>
        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-category-count-${name.toLowerCase().replace(/\s+/g, '-')}`}>
          {totalCount} {t('totalItems')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {translatedSubTypes.map((subType, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="bg-primary text-primary-foreground text-[11px] px-2 py-0.5"
              data-testid={`badge-subtype-${subType.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {subType}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
