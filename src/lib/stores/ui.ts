import { atom, map } from "nanostores";

// Mobile menu state
export const $isMobileMenuOpen = atom(false);

export function toggleMobileMenu(): void {
  $isMobileMenuOpen.set(!$isMobileMenuOpen.get());
}

export function closeMobileMenu(): void {
  $isMobileMenuOpen.set(false);
}

// Modal state
export interface ModalState {
  isOpen: boolean;
  content: string | null;
}

export const $modal = map<ModalState>({
  isOpen: false,
  content: null,
});

export function openModal(content: string): void {
  $modal.setKey("isOpen", true);
  $modal.setKey("content", content);
}

export function closeModal(): void {
  $modal.setKey("isOpen", false);
  $modal.setKey("content", null);
}
