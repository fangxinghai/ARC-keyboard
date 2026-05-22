import { Pencil, Minus, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  DropIndicator,
  Label,
  ListBox,
  ListBoxItem,
  Selection,
  useDragAndDrop,
} from "react-aria-components";
import { useModalRef } from "../misc/useModalRef";
import { GenericModal } from "../GenericModal";

interface Layer {
  id: number;
  name?: string;
}

export type LayerClickCallback = (index: number) => void;
export type LayerMovedCallback = (index: number, destination: number) => void;

interface LayerPickerProps {
  layers: Array<Layer>;
  selectedLayerIndex: number;
  canAdd?: boolean;
  canRemove?: boolean;

  onLayerClicked?: LayerClickCallback;
  onLayerMoved?: LayerMovedCallback;
  onAddClicked?: () => void | Promise<void>;
  onRemoveClicked?: () => void | Promise<void>;
  onLayerNameChanged?: (
    id: number,
    oldName: string,
    newName: string
  ) => void | Promise<void>;
}

interface EditLabelData {
  id: number;
  name: string;
}

const EditLabelModal = ({
  open,
  onClose,
  editLabelData,
  handleSaveNewLabel,
}: {
  open: boolean;
  onClose: () => void;
  editLabelData: EditLabelData;
  handleSaveNewLabel: (
    id: number,
    oldName: string,
    newName: string | null
  ) => void;
}) => {
  const ref = useModalRef(open);
  const [newLabelName, setNewLabelName] = useState(editLabelData.name);

  const handleSave = () => {
    handleSaveNewLabel(editLabelData.id, editLabelData.name, newLabelName);
    onClose();
  };

  return (
    <GenericModal
      ref={ref}
      onClose={onClose}
      className="min-w-min w-[30vw] flex flex-col"
    >
      <span className="mb-3 text-base font-semibold text-base-content">
        重命名层
      </span>
      <input
        className="p-2.5 rounded-xl glass text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 text-base-content"
        type="text"
        defaultValue={editLabelData.name}
        autoFocus
        placeholder="输入新名称..."
        onChange={(e) => setNewLabelName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
        }}
      />
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="btn-apple py-2 px-4 rounded-xl text-sm text-base-content/60 hover:bg-base-content/5"
          type="button"
          onClick={onClose}
        >
          取消
        </button>
        <button
          className="btn-apple py-2 px-4 rounded-xl text-sm bg-primary text-primary-content font-medium"
          type="button"
          onClick={() => {
            handleSave();
          }}
        >
          保存
        </button>
      </div>
    </GenericModal>
  );
};

export const LayerPicker = ({
  layers,
  selectedLayerIndex,
  canAdd,
  canRemove,
  onLayerClicked,
  onLayerMoved,
  onAddClicked,
  onRemoveClicked,
  onLayerNameChanged,
  ...props
}: LayerPickerProps) => {
  const [editLabelData, setEditLabelData] = useState<EditLabelData | null>(
    null
  );

  const layer_items = useMemo(() => {
    return layers.map((l, i) => ({
      name: l.name || i.toLocaleString(),
      id: l.id,
      index: i,
      selected: i === selectedLayerIndex,
    }));
  }, [layers, selectedLayerIndex]);

  const selectionChanged = useCallback(
    (s: Selection) => {
      if (s === "all") {
        return;
      }

      onLayerClicked?.(layer_items.findIndex((l) => s.has(l.id)));
    },
    [onLayerClicked, layer_items]
  );

  let { dragAndDropHooks } = useDragAndDrop({
    renderDropIndicator(target) {
      return (
        <DropIndicator
          target={target}
          className={"data-[drop-target]:outline outline-1 outline-primary"}
        />
      );
    },
    getItems: (keys) =>
      [...keys].map((key) => ({ "text/plain": key.toLocaleString() })),
    onReorder(e) {
      let startIndex = layer_items.findIndex((l) => e.keys.has(l.id));
      let endIndex = layer_items.findIndex((l) => l.id === e.target.key);
      onLayerMoved?.(startIndex, endIndex);
    },
  });

  const handleSaveNewLabel = useCallback(
    (id: number, oldName: string, newName: string | null) => {
      if (newName !== null) {
        onLayerNameChanged?.(id, oldName, newName);
      }
    },
    [onLayerNameChanged]
  );

  return (
    <div className="flex flex-col min-w-40">
      <div className="grid grid-cols-[1fr_auto_auto] items-center mb-1">
        <Label className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Layers
        </Label>
        {onRemoveClicked && (
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-error/15 hover:text-error disabled:opacity-25 transition-all duration-200 active:scale-90"
            disabled={!canRemove}
            onClick={onRemoveClicked}
          >
            <Minus className="size-3.5" />
          </button>
        )}
        {onAddClicked && (
          <button
            type="button"
            disabled={!canAdd}
            className="p-1 ml-0.5 rounded-lg hover:bg-primary/15 hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 active:scale-90"
            onClick={onAddClicked}
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>

      {editLabelData !== null && (
        <EditLabelModal
          open={editLabelData !== null}
          onClose={() => setEditLabelData(null)}
          editLabelData={editLabelData}
          handleSaveNewLabel={handleSaveNewLabel}
        />
      )}

      <ListBox
        aria-label="Keymap Layer"
        selectionMode="single"
        items={layer_items}
        disallowEmptySelection={true}
        selectedKeys={
          layer_items[selectedLayerIndex]
            ? [layer_items[selectedLayerIndex].id]
            : []
        }
        className="flex flex-col gap-1 cursor-pointer"
        onSelectionChange={selectionChanged}
        dragAndDropHooks={dragAndDropHooks}
        {...props}
      >
        {(layer_item) => (
          <ListBoxItem
            textValue={layer_item.name}
            className="
              p-2 group grid grid-cols-[1fr_auto] items-center
              rounded-xl text-sm font-medium
              transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
              outline-none
              aria-selected:bg-primary aria-selected:text-primary-content aria-selected:shadow-glow-primary
              hover:bg-base-content/5
              active:scale-95
            "
          >
            <span>{layer_item.name}</span>
            <Pencil
              className="h-3.5 w-3.5 mx-1 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity duration-200 cursor-pointer"
              onClick={() =>
                setEditLabelData({ id: layer_item.id, name: layer_item.name })
              }
            />
          </ListBoxItem>
        )}
      </ListBox>
    </div>
  );
};
