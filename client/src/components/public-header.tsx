import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Discover",
    href: "#",
    children: [
      { label: "About Dzaleka", href: "/about-dzaleka", description: "Learn about the camp's history and community" },
      { label: "About Us", href: "/about-us", description: "Our mission and team" },
      { label: "Life in Dzaleka", href: "/life-in-dzaleka", description: "Daily life and culture" },
      { label: "Things To Do", href: "/things-to-do", description: "Experiences and activities" },
      { label: "Arts & Culture", href: "/things-to-do/arts-culture", description: "Local art scene and performances" },
      { label: "Shopping & Markets", href: "/things-to-do/shopping", description: "Markets and local crafts" },
      { label: "Sports & Recreation", href: "/things-to-do/sports-recreation", description: "Sports and outdoor activities" },
      { label: "Host Community", href: "/things-to-do/host-community", description: "Connect with locals" },
      { label: "What's On", href: "/whats-on", description: "Events and festivals" },
      { label: "Blog", href: "/blog", description: "Stories and updates" },
    ],
  },
  {
    label: "Plan Your Trip",
    href: "/plan-your-trip",
    children: [
      { label: "Trip Planner", href: "/plan-your-trip", description: "Plan your visit step by step" },
      { label: "Visitor Essentials", href: "/plan-your-trip/visitor-essentials", description: "What to know before you go" },
      { label: "Public Holidays", href: "/plan-your-trip/public-holidays", description: "Malawi public holidays" },
      { label: "Accommodation", href: "/accommodation", description: "Where to stay" },
      { label: "Safe Travel", href: "/plan-your-trip/safe-travel", description: "Safety guidelines" },
    ],
  },
  { label: "Accommodation", href: "/accommodation" },
  { label: "What's On", href: "/whats-on" },
  { label: "Blog", href: "/blog" },
];

interface PublicHeaderProps {
  /** Override active path detection */
  activePath?: string;
}

export function PublicHeader({ activePath }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const currentPath = activePath || location;

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png"
              alt="Visit Dzaleka Logo"
              className="h-10 w-10 rounded-lg shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Visit Dzaleka</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Official Portal
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation - Radix NavigationMenu for keyboard accessibility */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), isActive("/") && currentPath === "/" && "text-primary")}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* Discover Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Discover</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-1 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <li className="col-span-2 pb-2 mb-2 border-b">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</span>
                  </li>
                  <ListItem href="/about-dzaleka" title="About Dzaleka">
                    Learn about the camp's history
                  </ListItem>
                  <ListItem href="/about-us" title="About Us">
                    Our mission and team
                  </ListItem>
                  <ListItem href="/life-in-dzaleka" title="Life in Dzaleka">
                    Daily life and culture
                  </ListItem>
                  <ListItem href="/friends-of-dzaleka" title="Friends of Dzaleka">
                    Our supporters and partners
                  </ListItem>

                  <li className="col-span-2 py-2 mt-2 border-t border-b">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Things To Do</span>
                  </li>
                  <ListItem href="/things-to-do" title="All Experiences">
                    Browse all activities
                  </ListItem>
                  <ListItem href="/things-to-do/arts-culture" title="Arts & Culture">
                    Local art and performances
                  </ListItem>
                  <ListItem href="/things-to-do/shopping" title="Shopping & Markets">
                    Markets and crafts
                  </ListItem>
                  <ListItem href="/things-to-do/sports-recreation" title="Sports & Recreation">
                    Sports and outdoor fun
                  </ListItem>
                  <ListItem href="/things-to-do/host-community" title="Host Community">
                    Connect with locals
                  </ListItem>
                  <ListItem href="/whats-on" title="What's On">
                    Events and festivals
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Plan Your Trip Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Plan Your Trip</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-1 p-4">
                  <ListItem href="/plan-your-trip" title="Trip Planner">
                    Plan your visit step by step
                  </ListItem>
                  <ListItem href="/plan-your-trip/visitor-essentials" title="Visitor Essentials">
                    What to know before you go
                  </ListItem>
                  <ListItem href="/plan-your-trip/public-holidays" title="Public Holidays">
                    Malawi public holidays
                  </ListItem>
                  <ListItem href="/plan-your-trip/dzaleka-map" title="Dzaleka Map">
                    Navigate the camp
                  </ListItem>
                  <ListItem href="/plan-your-trip/safe-travel" title="Safe Travel">
                    Safety guidelines
                  </ListItem>
                  <ListItem href="/accommodation" title="Accommodation">
                    Where to stay
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/blog">
                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), isActive("/blog") && "text-primary")}>
                  Blog
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/faq">
                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), isActive("/faq") && "text-primary")}>
                  FAQ
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Book Now</Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t bg-background p-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)} active={currentPath === "/"}>
              Home
            </MobileNavLink>

            {/* Discover Section */}
            <div className="pt-3 pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">Discover</span>
            </div>
            <MobileNavLink href="/about-dzaleka" onClick={() => setMobileMenuOpen(false)} active={isActive("/about-dzaleka")}>
              About Dzaleka
            </MobileNavLink>
            <MobileNavLink href="/about-us" onClick={() => setMobileMenuOpen(false)} active={isActive("/about-us")}>
              About Us
            </MobileNavLink>
            <MobileNavLink href="/life-in-dzaleka" onClick={() => setMobileMenuOpen(false)} active={isActive("/life-in-dzaleka")}>
              Life in Dzaleka
            </MobileNavLink>
            <MobileNavLink href="/things-to-do" onClick={() => setMobileMenuOpen(false)} active={isActive("/things-to-do")}>
              Things To Do
            </MobileNavLink>
            <MobileNavLink href="/whats-on" onClick={() => setMobileMenuOpen(false)} active={isActive("/whats-on")}>
              What's On
            </MobileNavLink>
            <MobileNavLink href="/blog" onClick={() => setMobileMenuOpen(false)} active={isActive("/blog")}>
              Blog
            </MobileNavLink>

            {/* Plan Section */}
            <div className="pt-3 pb-1 border-t mt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">Plan Your Trip</span>
            </div>
            <MobileNavLink href="/plan-your-trip" onClick={() => setMobileMenuOpen(false)} active={currentPath === "/plan-your-trip"}>
              Trip Planner
            </MobileNavLink>
            <MobileNavLink href="/plan-your-trip/visitor-essentials" onClick={() => setMobileMenuOpen(false)} active={isActive("/plan-your-trip/visitor-essentials")}>
              Visitor Essentials
            </MobileNavLink>
            <MobileNavLink href="/accommodation" onClick={() => setMobileMenuOpen(false)} active={isActive("/accommodation")}>
              Accommodation
            </MobileNavLink>

            {/* Support Section */}
            <div className="pt-3 pb-1 border-t mt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">Support</span>
            </div>
            <MobileNavLink href="/faq" onClick={() => setMobileMenuOpen(false)} active={isActive("/faq")}>
              FAQ
            </MobileNavLink>
            <MobileNavLink href="/support-our-work" onClick={() => setMobileMenuOpen(false)} active={isActive("/support-our-work")}>
              Support Our Work
            </MobileNavLink>
            <MobileNavLink href="/contact" onClick={() => setMobileMenuOpen(false)} active={isActive("/contact")}>
              Contact Us
            </MobileNavLink>

            {/* CTA Buttons */}
            <div className="flex gap-2 pt-4 mt-4 border-t">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/login">Book Now</Link>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

// Helper component for dropdown list items
const ListItem = ({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

// Helper component for mobile nav links
const MobileNavLink = ({
  href,
  children,
  onClick,
  active,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
        active ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
    >
      {children}
    </Link>
  );
};
