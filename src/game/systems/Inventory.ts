export class Inventory {
  private slots: (ItemSlot | null)[];
  private maxSlots: number;

  constructor(maxSlots: number) {
    this.maxSlots = maxSlots;
    this.slots = new Array(maxSlots).fill(null);
  }

  // Add item to inventory
  public addItem(item: ItemData): boolean {
    // If item is stackable, try to find existing stack
    if (item.stackable) {
      const existingSlotIndex = this.findItemSlot(item.type);
      
      if (existingSlotIndex !== -1) {
        const existingSlot = this.slots[existingSlotIndex]!;
        
        // Check if stack has room
        if (!existingSlot.maxStack || existingSlot.quantity < existingSlot.maxStack) {
          existingSlot.quantity++;
          return true;
        }
      }
    }
    
    // Find empty slot
    const emptySlotIndex = this.findEmptySlot();
    
    if (emptySlotIndex !== -1) {
      this.slots[emptySlotIndex] = {
        ...item,
        quantity: 1
      };
      return true;
    }
    
    // Inventory is full
    return false;
  }

  // Remove item from inventory
  public removeItem(slotIndex: number, quantity: number = 1): boolean {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;
    
    const slot = this.slots[slotIndex];
    if (!slot) return false;
    
    if (slot.quantity <= quantity) {
      // Remove entire stack
      this.slots[slotIndex] = null;
    } else {
      // Remove partial stack
      slot.quantity -= quantity;
    }
    
    return true;
  }

  // Get item from slot
  public getItem(slotIndex: number): ItemSlot | null {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return null;
    return this.slots[slotIndex];
  }

  // Get all items
  public getAllItems(): (ItemSlot | null)[] {
    return [...this.slots];
  }

  // Find slot with specific item type
  private findItemSlot(itemType: ItemType): number {
    return this.slots.findIndex(slot => 
      slot !== null && slot.type === itemType
    );
  }

  // Find first empty slot
  private findEmptySlot(): number {
    return this.slots.findIndex(slot => slot === null);
  }

  // Check if inventory is full
  public isFull(): boolean {
    return this.slots.every(slot => slot !== null);
  }

  // Get number of empty slots
  public getEmptySlotCount(): number {
    return this.slots.filter(slot => slot === null).length;
  }

  // Clear inventory
  public clear(): void {
    this.slots = new Array(this.maxSlots).fill(null);
  }
}

// Item slot interface
export interface ItemSlot extends ItemData {
  quantity: number;
}
