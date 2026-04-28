export default function ListItem({ children, className = "", ...props }) {
  return (
    <div className={`rapporto-item ${className}`} {...props}>
      {children}
    </div>
  );
}
