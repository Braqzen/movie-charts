
## Update Movie Catalogue

You need an TMDB Account, API key and a dump file of all movies.

https://files.tmdb.org/p/exports/movie_ids_MM_DD_YYYY.json.gz

```sh
export DATABASE_URL="postgresql://user:password@localhost:5432/database"
export TMDB_API_KEY=""
cargo run -p tmdb add-movies --file ./movie_ids_05_06_2026.json
```
