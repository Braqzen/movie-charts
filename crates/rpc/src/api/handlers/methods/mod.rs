mod delete;
mod get;
mod post;

pub use delete::ratings::delete_rating_handler;
pub use get::{
    catalog_genre_counts::catalog_genre_counts_handler, movies::search_movies_handler,
    ratings::user_ratings_handler, recommendations::recommendations_handler, users::users_handler,
};
pub use post::{ratings::insert_rating_handler, users::insert_user_handler};
