import { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const useDragDrop = (items, setItems, groups, setGroups) => {
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ============================================================
  // HANDLE DRAG START
  // ============================================================
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    if (active.id.toString().startsWith('group-')) {
      setActiveType('group');
    } else {
      setActiveType('item');
    }
  };

  // ============================================================
  // HANDLE DRAG END - GROUP
  // ============================================================
  const handleDragEndGroup = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = groups.indexOf(active.id.toString().replace('group-', ''));
    const newIndex = groups.indexOf(over.id.toString().replace('group-', ''));
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newGroups = arrayMove(groups, oldIndex, newIndex);
      setGroups(newGroups);
      localStorage.setItem('board-groups', JSON.stringify(newGroups));
    }
  };

  // ============================================================
  // HANDLE DRAG END - ITEM
  // ============================================================
  const handleDragEndItem = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const activeId = active.id.toString().replace('item-', '');
    const overId = over.id.toString().replace('item-', '');
    
    // Cari item di items (termasuk nested)
    const findAllItems = (items) => {
      let result = [];
      items.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          result = result.concat(findAllItems(item.children));
        }
      });
      return result;
    };

    const allItems = findAllItems(items);
    const oldIndex = allItems.findIndex(item => item.id === activeId);
    const newIndex = allItems.findIndex(item => item.id === overId);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(allItems, oldIndex, newIndex);
      
      // Reconstruct tree
      const buildTree = (flatItems) => {
        const rootItems = [];
        const map = {};
        flatItems.forEach(item => {
          map[item.id] = { ...item, children: [] };
        });
        flatItems.forEach(item => {
          if (item.parentId && map[item.parentId]) {
            map[item.parentId].children.push(map[item.id]);
          } else {
            rootItems.push(map[item.id]);
          }
        });
        return rootItems;
      };

      const newTree = buildTree(reorderedItems);
      setItems(newTree);
      localStorage.setItem('forelItems', JSON.stringify(newTree));
    }
  };

  // ============================================================
  // MAIN HANDLE DRAG END
  // ============================================================
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    if (active.id.toString().startsWith('group-')) {
      handleDragEndGroup(event);
    } else {
      handleDragEndItem(event);
    }

    setActiveId(null);
    setActiveType(null);
  };

  return {
    sensors,
    activeId,
    activeType,
    handleDragStart,
    handleDragEnd,
    DndContext,
    SortableContext,
    DragOverlay,
    verticalListSortingStrategy,
    arrayMove,
  };
};
