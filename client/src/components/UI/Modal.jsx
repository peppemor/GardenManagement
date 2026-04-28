import { useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

export default function Modal({
  isOpen,
  title = "Messaggio",
  message = "",
  children,
  onClose,
  actions,
  closeOnOverlay = false,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedActions =
    actions && actions.length > 0
      ? actions
      : [{ label: "OK", variant: "primary", onClick: onClose }];

  function handleOverlayClick() {
    if (!closeOnOverlay) return;
    if (onClose) onClose();
  }

  const modalContent = (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        {children ? children : <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          {resolvedActions.map((action, index) => (
            <Button
              key={`${action.label}-${index}`}
              variant={action.variant || "primary"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modalContent;
  return createPortal(modalContent, document.body);
}
