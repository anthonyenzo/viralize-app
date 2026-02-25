import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X, Rocket } from "lucide-react";
import { cn } from "../../lib/utils";

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-sky-400/30">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-sky-400" />
                    <span className="font-bold text-lg bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent">
                        Viralize AI
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-zinc-400 hover:text-white"
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 w-64",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <Sidebar className="flex" onItemClick={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 pt-16 md:pt-0 overflow-y-auto h-screen bg-transparent">
                <div className="h-full w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

// Temporary internal wrapper if needed, but <Sidebar> is already self-contained.
// Just ensuring Sidebar is exported correctly.
// Actually, Sidebar component has "hidden md:flex" classes which breaks the mobile logic if we just render it.
// We need to modify Sidebar to NOT hide itself if we are controlling visibility via parent.
// OR we just wrap it in a div that overrides the display style.
// The Sidebar component has `hidden md:flex`.
// I will just use a div wrapper in the mobile menu that forces display.
// Wait, `hidden` has high specificity in Tailwind? No, it's just a class.
// If I put `flex` on the parent, does it override `hidden` on child? No.
// I should update Sidebar to accept a `className` prop to override visibility.

