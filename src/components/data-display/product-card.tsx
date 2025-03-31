// Componente ProductCard
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

// Definindo interface Product já que não encontrou o import
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  sku: string;
  stock: number;
  stockThreshold: number;
  description?: string;
}

// Componentes de UI internos (já que os módulos externos não estão disponíveis)
const Card = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
);

const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

// Botão simplificado
const Button = ({
  className,
  variant = "default",
  size = "default",
  disabled = false,
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "default" | "sm";
}) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors",
      variant === "default"
        ? "bg-primary text-primary-foreground hover:bg-primary/90"
        : "border border-input hover:bg-accent hover:text-accent-foreground",
      size === "sm" ? "h-9 px-3 text-xs" : "h-10 px-4 py-2",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    )}
    disabled={disabled}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

// Ícones simples em vez de usar lucide-react
const ShoppingCart = () => <span>🛒</span>;
const Eye = () => <span>👁️</span>;

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
  compact = false,
}: ProductCardProps) {
  const { name, price, imageUrl, sku, stock, stockThreshold, description } =
    product;

  // Determinar o status do estoque
  const stockStatus =
    stock <= 0 ? "out" : stock <= stockThreshold ? "low" : "in";

  // Status em português
  const stockLabels = {
    out: "Sem estoque",
    low: "Estoque baixo",
    in: "Em estoque",
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative pt-[100%] bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">Sem imagem</span>
          </div>
        )}
      </div>

      <CardContent className="flex-grow p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold truncate">{name}</h3>
          <StatusBadge status={stockStatus}>
            {stockLabels[stockStatus]}
          </StatusBadge>
        </div>

        <div className="text-sm text-muted-foreground mb-2">Código: {sku}</div>

        {!compact && description && (
          <p className="text-sm line-clamp-2 mb-3 text-muted-foreground">
            {description}
          </p>
        )}

        <div className="text-lg font-bold mt-auto">{formatCurrency(price)}</div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewDetails}
          >
            <Eye />
            <span className="ml-2">Detalhes</span>
          </Button>
        )}

        {onAddToCart && (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={onAddToCart}
            disabled={stock <= 0}
          >
            <ShoppingCart />
            <span className="ml-2">Adicionar</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
