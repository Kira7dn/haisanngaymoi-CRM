import * as React from "react";
import { CheckCircle2, Snowflake, Recycle, QrCode, Sparkles, Heart, Waves, Eye, Shell, Ship, Truck, Package, CalendarX, Target, Leaf, BarChart3 } from "lucide-react";

// Utility function để render icon từ string
export function renderIconFromString(iconName: string, className = "w-5 h-5 text-cyan-300") {
    const iconComponents: Record<string, React.ComponentType<any>> = {
        snowflake: Snowflake,
        recycle: Recycle,
        checkCircle: CheckCircle2,
        qrCode: QrCode,
        sparkles: Sparkles,
        heart: Heart,
        waves: Waves,
        eye: Eye,
        shell: Shell,
        ship: Ship,
        truck: Truck,
        package: Package,
        calendarX: CalendarX,
        target: Target,
        leaf: Leaf,
        barChart3: BarChart3,
    };

    const IconComponent = iconComponents[iconName] || CheckCircle2;
    return <IconComponent className={className} />;
}

// Component Icon với prop type và color
interface IconProps {
    type: string;
    className?: string;
    color?: string; // Thêm prop color để override
}

export function Icon({ type, className = "w-5 h-5 text-cyan-300", color }: IconProps) {
    // Nếu có color prop, sử dụng nó, nếu không thì dùng default
    const finalClassName = color || className;
    return renderIconFromString(type, finalClassName);
}
