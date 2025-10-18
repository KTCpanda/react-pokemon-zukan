// src/pages/PokemonList.tsx
import React, { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiQueryKeys } from '../queryKeys';
import { fetchPokemonListWithJapaneseNames } from '../api/pokemonWithJapaneseName';
import type { PokemonWithJapaneseName } from '../api/pokemonWithJapaneseName';
import PokemonCard from '../components/PokemonCard';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { pokemonTypesMap } from '../pokemonTypesMap';

const PokemonList: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [apiQueryKeys.pokemon.list()],
    queryFn: ({ pageParam = 0 }) => fetchPokemonListWithJapaneseNames(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.next) {
        return pages.length * 20;
      }
      return undefined;
    },
  });

  const allPokemon = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.results) ?? [];
  }, [data]);

  const filteredPokemon = React.useMemo(() => {
    return allPokemon.filter((pokemon) => {
      const searchTermLower = searchTerm.toLowerCase();
      const nameMatch = pokemon.japaneseName.toLowerCase().includes(searchTermLower);
      const numberMatch = pokemon.number.includes(searchTerm);

      const typeInfo = pokemonTypesMap.find((t) => t.jaType === selectedType);
      const englishType = typeInfo ? typeInfo.type : '';

      // The types property on pokemon is not complete, so we can't filter by type yet.
      // This will be addressed in a future step.
      // For now, let's just filter by name and number.
      const typeMatch = selectedType === '' || (pokemon as any).types?.some((t: any) => t.type.name === englishType);

      return (nameMatch || numberMatch) && typeMatch;
    });
  }, [allPokemon, searchTerm, selectedType]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <PokemonListSkeleton />;
  if (status === 'error') return <div>エラーが発生しました</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col sm:flex-row gap-4 p-4 bg-gray-100 rounded-lg">
        <input
          type="text"
          placeholder="図鑑No. or 名前で検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded-md w-full sm:w-1/2"
        />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border p-2 rounded-md w-full sm:w-1/2"
        >
          <option value="">すべてのタイプ</option>
          {pokemonTypesMap.map((type) => (
            <option key={type.type} value={type.jaType}>
              {type.jaType}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredPokemon.map((pokemon: PokemonWithJapaneseName) => (
          <PokemonCard key={pokemon.name} pokemon={pokemon} />
        ))}
      </div>
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {isFetchingNextPage ? (
          <Loader />
        ) : hasNextPage && filteredPokemon.length > 0 ? (
          '続きを読み込む'
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

// ローダーコンポーネント
const Loader: React.FC = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
);

const PokemonListSkeleton: React.FC = () => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(18)].map((_, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-4">
            <Skeleton height={120} />
            <Skeleton width={80} height={20} className="mt-2" />
            <Skeleton width={100} height={16} className="mt-1" />
          </div>
        ))}
      </div>
      <div className="h-10 flex items-center justify-center">
        <Skeleton width={100} height={20} />
      </div>
    </div>
  );
};

export default PokemonList;

