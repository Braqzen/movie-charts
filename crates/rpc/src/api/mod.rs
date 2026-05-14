mod handlers;
mod response;

pub use handlers::{
    fallback::not_found,
    methods::{
        catalog_genre_counts_handler, catalog_keywords_handler, delete_rating_handler,
        delete_user_keyword_handler, insert_rating_handler, insert_user_handler,
        insert_user_keyword_handler, list_user_keywords_handler, recommendations_handler,
        search_movies_handler, user_ratings_handler, users_handler,
    },
};
pub use response::Error;
