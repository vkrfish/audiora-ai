import { Link } from "react-router-dom";
import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconSize?: number;
    textSize?: string;
    isLink?: boolean;
}

const Logo = ({ className, iconSize = 5, textSize = "text-xl", isLink = true }: LogoProps) => {
    const content = (
        <div className={cn("flex items-center gap-2 group", className)}>
            <div className="relative">
                <div className={cn(
                    "rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all duration-300",
                    iconSize === 5 ? "w-10 h-10" : "w-12 h-12"
                )}>
                    <Headphones className={cn("text-primary-foreground", `w-${iconSize} h-${iconSize}`)} />
                </div>
            </div>
            <span className={cn("font-display font-bold gradient-text", textSize)}>Audiora</span>
        </div>
    );

    if (isLink) {
        return <Link to="/">{content}</Link>;
    }

    return content;
};

export default Logo;
