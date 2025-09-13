export interface NavbarButton {
  id: string;
  text: string;
  icon: string;
  action: () => void;
  visible?: boolean;
  tuiSlot: 'right' | 'left';
}
