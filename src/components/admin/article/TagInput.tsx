import { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { getTags, getOrCreateTag } from '../../../services/articleService';
import type { ArticleTag } from '../../../types/article';

interface TagInputProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagInput({ selectedTagIds, onChange }: TagInputProps) {
  const [allTags, setAllTags] = useState<ArticleTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadTags() {
      try {
        const data = await getTags();
        setAllTags(data);
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTags();
  }, []);

  const selectedTags = allTags.filter(tag => selectedTagIds.includes(tag.id));
  const availableTags = allTags.filter(tag => !selectedTagIds.includes(tag.id));

  const handleAddTag = (tagId: string) => {
    onChange([...selectedTagIds, tagId]);
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const tagId = await getOrCreateTag(newTagName.trim());

      // Refresh tags list
      const updatedTags = await getTags();
      setAllTags(updatedTags);

      // Add to selected
      if (!selectedTagIds.includes(tagId)) {
        onChange([...selectedTagIds, tagId]);
      }

      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading tags...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Tags</label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:text-purple-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add Existing Tag */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.slice(0, 10).map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleAddTag(tag.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-purple-100 hover:text-purple-700 transition"
            >
              <Plus className="w-3 h-3" />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Create New Tag */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={e => setNewTagName(e.target.value)}
          placeholder="Tag baru..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCreateTag();
            }
          }}
        />
        <button
          type="button"
          onClick={handleCreateTag}
          disabled={!newTagName.trim() || isCreating}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
