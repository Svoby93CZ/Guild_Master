import React from 'react';
import { InventoryItem } from '../types';

export const useDragAndDrop = () => {
  const onDragStart = (e: React.DragEvent, itemInstanceId: string, source: 'inventory' | 'hero', heroId?: string) => {
    e.dataTransfer.setData('itemInstanceId', itemInstanceId);
    e.dataTransfer.setData('source', source);
    if (heroId) {
      e.dataTransfer.setData('heroId', heroId);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return { onDragStart, onDragOver };
};
