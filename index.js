const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  # enum is a limited / fixed amount of answers
  enum Status {
    WATCHED
    INETERESTED
    NOT_INTERESTED
    UNKNOWN
  }

  type Actor {
    id: ID!
    name: String!
  }

  type Movie {
    id: ID! # this is just a serialized String
    title: String!
    releaseDate: String
    rating: Int
    status: Status
    actor: [Actor] # valid = null, [], [...some data] | NOT valid = [...some data WITHOUT name OR id]
    # actor: [Actor]! # valid = [], [...some data]
    # actor: [Actor!]! # Valid [...some data]
    # fake: Float
    # fake2: Boolean
  }

  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }
`;

const movies = [
  {
    id: "asdfsf1asd",
    title: "Suh Dudes",
    releaseDate: "10-10-2012",
    rating: 5,
  },
  {
    id: "asdfsccvxbcbf",
    title: "Black Shirt",
    releaseDate: "10-10-2009",
    rating: 2,
    actor: [
      {
        id: "asdfsf",
        name: "Gordon Li",
      },
    ],
  },
];

const resolvers = {
  Query: {
    movies: () => {
      return movies;
    },
    movie: (obj, { id }, context, info) => {
      const foundMovie = movies.find((movie) => {
        return movie.id === id;
      });
      return foundMovie;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server
  .listen({
    port: process.env.PORT || 4000,
  })
  .then(({ url }) => {
    console.log(`server started at ${url}`);
  });
