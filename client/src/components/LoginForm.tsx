import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User, ArrowRight, ArrowDown, Package, LayoutGrid, Box, Wrench } from "lucide-react";

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function LoginForm({ onLogin, isLoading = false, error }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const scrollToLogin = () => {
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const categories = [
    { 
      title: "Dashboard", 
      subtitle: "Analytics & Reports",
      icon: LayoutGrid,
      color: "bg-primary"
    },
    { 
      title: "Inventory", 
      subtitle: "Track Your Items",
      icon: Package,
      color: "bg-secondary"
    },
    { 
      title: "Categories", 
      subtitle: "Organize Everything",
      icon: Box,
      color: "bg-primary"
    },
    { 
      title: "Maintenance", 
      subtitle: "Keep Everything Working",
      icon: Wrench,
      color: "bg-secondary"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mil-hero-1 mil-up relative min-h-screen flex items-center overflow-visible">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-3xl" style={{ paddingTop: '60px' }}>
            <div className="mil-mb15">
              <Package className="w-8 h-8 text-secondary" />
            </div>
            <p className="mil-stylized mil-m2 mil-mb60">Welcome!</p>
            
            <div className="relative mil-mb30">
              <h1 className="mil-display1 mil-rubber text-foreground">
                INVENTORY
              </h1>
            </div>
            
            <h2 className="mil-head2 mil-m2 mil-mb60">
              Complete asset management system
            </h2>
            
            <div 
              className="inline-flex items-center gap-3 cursor-pointer group"
              onClick={scrollToLogin}
              data-testid="button-scroll-to-login"
            >
              <div className="relative w-24 h-24 rounded-full border-2 border-primary flex items-center justify-center group-hover:bg-primary/10 transition-all duration-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <ArrowDown className="w-5 h-5 text-primary-foreground animate-bounce" />
                  </div>
                </div>
                <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                  <defs>
                    <path id="circle" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"/>
                  </defs>
                  <text className="fill-current text-xs uppercase tracking-widest text-muted-foreground">
                    <textPath href="#circle">
                      sign in - sign in - sign in -
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      <div id="login-section" className="py-24 px-6 lg:px-12">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <h2 className="mil-head1">Sign <span className="mil-a2">In</span></h2>
              </div>
              <p className="mil-text-md mil-m2 mb-8 max-w-md">
                Enter your credentials to access the inventory management system. 
                Track assets, manage reservations, and generate reports.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="username" className="mil-stylized text-xs">Username</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="pl-12 h-14 rounded-full border-2 border-border bg-card focus:border-primary transition-colors"
                      required
                      data-testid="input-username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="mil-stylized text-xs">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-12 pr-12 h-14 rounded-full border-2 border-border bg-card focus:border-primary transition-colors"
                      required
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" data-testid="alert-error" className="rounded-xl">
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground font-medium text-base transition-all hover:translate-y-[-2px]"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <p className="mil-stylized mil-m2">Features</p>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((category, index) => (
                  <div 
                    key={index}
                    className="group p-6 rounded-xl bg-card border border-border hover-elevate transition-all duration-300 cursor-pointer"
                    data-testid={`card-feature-${index}`}
                  >
                    <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center mb-4`}>
                      <category.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="mil-head4 mb-2">{category.title}</h3>
                    <p className="mil-text-sm mil-m2">{category.subtitle}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-6 bg-card rounded-xl border border-border mt-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Secure Authentication</p>
                    <p className="mil-text-sm mil-m2">
                      Your credentials are encrypted and protected with industry-standard security measures.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
