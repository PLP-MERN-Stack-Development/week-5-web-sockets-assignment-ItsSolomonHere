export function Card({ children, className = '' }) {
  return <div className={`bg-white shadow rounded ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = '' }) {
  return <div className={`border-b px-4 py-2 ${className}`}>{children}</div>;
}
export function CardTitle({ children, className = '' }) {
  return <h2 className={`text-lg font-bold ${className}`}>{children}</h2>;
}
export function CardContent({ children, className = '' }) {
  return <div className={`px-4 py-2 ${className}`}>{children}</div>;
}
export function CardFooter({ children, className = '' }) {
  return <div className={`border-t px-4 py-2 ${className}`}>{children}</div>;
} 