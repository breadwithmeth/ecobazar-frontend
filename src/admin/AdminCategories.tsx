import React from 'react';

interface Category {
  id: number;
  name: string;
}

interface Props {
  categories: Category[];
  loading: boolean;
  error: string;
  newCat: string;
  editId: number | null;
  editName: string;
  onAdd: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  setNewCat: (v: string) => void;
  setEditId: (id: number | null) => void;
  setEditName: (v: string) => void;
  onBack: () => void;
}

const AdminCategories: React.FC<Props> = ({
  categories, loading, error, newCat, editId, editName,
  onAdd, onEdit, onDelete, setNewCat, setEditId, setEditName, onBack
}) => {
  // Добавляем отладочную информацию
  console.log('AdminCategories rendered with categories:', categories);
  
  // Фильтруем undefined и невалидные элементы
  const validCategories = (categories || []).filter(cat => cat && typeof cat === 'object' && cat.id && cat.name);
  
  return (
  <div>
    <h3>Управление категориями</h3>
    <div style={{ color: '#888', marginBottom: 12 }}>Добавляйте, редактируйте и удаляйте категории товаров.</div>
    {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
    {loading ? (
      <div style={{ color: '#888', marginBottom: 8 }}>Загрузка...</div>
    ) : (
      <>
        {validCategories.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 12, fontStyle: 'italic' }}>
            Категории не найдены. Добавьте первую категорию ниже.
          </div>
        ) : (
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {validCategories.map(cat => (
              <li key={cat.id} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                {editId === cat.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 15 }}
                    />
                    <button onClick={() => onEdit(cat.id)} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 12px', cursor: 'pointer' }}>Сохранить</button>
                    <button onClick={() => { setEditId(null); setEditName(''); }} style={{ background: '#eee', color: '#888', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 10px', cursor: 'pointer' }}>×</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{cat.name}</span>
                    <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 10px', cursor: 'pointer' }}>✎</button>
                    <button onClick={() => onDelete(cat.id)} style={{ background: '#eee', color: '#d00', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 10px', cursor: 'pointer' }}>🗑</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            placeholder="Новая категория"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
          />
          <button onClick={onAdd} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer' }}>Добавить</button>
        </div>
      </>
    )}
    <button onClick={onBack} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', marginTop: 18 }}>← Назад</button>
  </div>
);
};

export default AdminCategories;
