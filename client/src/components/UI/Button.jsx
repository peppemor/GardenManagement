export default function Button({ children, variant = "primary", ...props }) {
  const classMap = {
    primary: "active-btn",
    secondary: "secondary-button",
    danger: "danger-button"
  };

  return (
    <button className={classMap[variant]} {...props}>
      {children}
    </button>
  );
}
