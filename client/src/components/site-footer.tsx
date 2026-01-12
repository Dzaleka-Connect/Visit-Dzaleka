import { Link } from "wouter";
import { MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp, FaLinkedin, FaTiktok } from "react-icons/fa";

const socialLinks = [
    { icon: FaFacebook, href: "https://www.facebook.com/dzalekaonline/", label: "Facebook" },
    { icon: FaInstagram, href: "https://www.instagram.com/dzalekaonline/", label: "Instagram" },
    { icon: FaTwitter, href: "https://twitter.com/dzalekaconnect", label: "Twitter" },
    { icon: FaWhatsapp, href: "https://www.whatsapp.com/channel/0029VaZJG7U1SWsysKsrGC2E", label: "WhatsApp" },
    { icon: FaLinkedin, href: "https://www.linkedin.com/company/dzalekaconnect/", label: "LinkedIn" },
    { icon: FaTiktok, href: "https://www.tiktok.com/@dzaleka", label: "TikTok" },
];

export function SiteFooter() {
    return (
        <footer className="border-t bg-background py-12">
            <div className="container mx-auto px-4">
                <div className="grid gap-8 md:grid-cols-4 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span className="font-bold text-lg">Dzaleka Visit</span>
                        </div>
                        <p className="text-muted-foreground max-w-xs mb-6">
                            Connecting visitors with the vibrant community of Dzaleka Refugee Camp through guided tours and cultural exchange.
                        </p>
                        {/* Social Media Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Explore</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/things-to-do" className="hover:text-primary">Things To Do</Link></li>
                            <li><Link href="/accommodation" className="hover:text-primary">Accommodation</Link></li>
                            <li><Link href="/whats-on" className="hover:text-primary">What's On</Link></li>
                            <li><Link href="/plan-your-trip" className="hover:text-primary">Plan Your Trip</Link></li>
                            <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Contact</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>info@mail.dzaleka.com</li>
                            <li>Dowa District, Malawi</li>
                            <li className="pt-2">
                                <Link href="/login" className="hover:text-primary font-medium">Book a Tour →</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/disclaimer" className="hover:text-primary">Disclaimer</Link></li>
                            <li><Link href="/cookie-notice" className="hover:text-primary">Cookie Notice</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="border-t pt-6 pb-4">
                    <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto leading-relaxed">
                        <strong>Disclaimer:</strong> Visit Dzaleka is a community-led tourism initiative.
                        All tours follow established safety protocols and camp regulations.
                        <Link href="/disclaimer" className="text-primary hover:underline ml-1">Read full disclaimer</Link> |
                        <Link href="/cookie-notice" className="text-primary hover:underline ml-1">Cookie policy</Link>
                    </p>
                </div>

                <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} Dzaleka Visit. All rights reserved.</p>
                    <p>
                        Part of <a href="https://services.dzaleka.com" className="text-primary hover:underline">Dzaleka Online Services</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
