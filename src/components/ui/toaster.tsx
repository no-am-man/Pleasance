
"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Helper function to extract text from React nodes
function extractTextFromNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return node.toString();
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join('');
  }
  if (React.isValidElement(node) && node.props.children) {
    return extractTextFromNode(node.props.children);
  }
  return '';
}

export function Toaster() {
  const { toasts } = useToast()

  const handleContextMenu = (e: React.MouseEvent, title?: React.ReactNode, description?: React.ReactNode) => {
    e.preventDefault();
    
    const titleText = extractTextFromNode(title);
    const descriptionText = extractTextFromNode(description);
    
    const textToCopy = [titleText, descriptionText].filter(Boolean).join('\n');

    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            onContextMenu={(e) => handleContextMenu(e, title, description)}
            >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
