// src/api/pokemonWithJapaneseName.ts
import { INITIAL_POKEMON_LIST_LIMIT } from '../config';
import { fetchPokemonList } from './pokemon';
import { fetchPokemonJapaneseName } from './pokemonSpecies';
import type { PokemonListResult } from './pokemon';
import type { Pokemon } from './pokemon.type';


export type PokemonWithJapaneseName = {
  name: string;          
  url: string;           
  japaneseName: string;  // 日本語名
  number: string;        // 図鑑番号
  types: string[];      
};

export type PokemonListWithJapaneseNames = {
  count: number;                       
  next: string | null;                 
  previous: string | null;              
  results: PokemonWithJapaneseName[];   
};


export const fetchPokemonListWithJapaneseNames = async (offset: number = 0, limit: number = INITIAL_POKEMON_LIST_LIMIT): Promise<PokemonListWithJapaneseNames> => {
  
  const pokemonList: PokemonListResult = await fetchPokemonList(offset, limit);
  
  // 日本語名を追加
  const updatedResults: PokemonWithJapaneseName[] = await Promise.all(
    pokemonList.results.map(async (pokemon) => {
      
      const speciesUrl = pokemon.url.replace('https://pokeapi.co/api/v2/pokemon/', 'https://pokeapi.co/api/v2/pokemon-species/');
      // 日本
      const japaneseName = await fetchPokemonJapaneseName(speciesUrl);
 
      const pokemonDetails: Pokemon = await fetch(pokemon.url).then(res => res.json());
      
     
      return {
        ...pokemon,
        japaneseName,
        number: pokemonDetails.id.toString(),
        types: pokemonDetails.types.map((t) => t.type.name),
      };
    })
  );
  
  
  return { ...pokemonList, results: updatedResults };
};

