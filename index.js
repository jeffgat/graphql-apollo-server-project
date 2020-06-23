const { ApolloServer, gql, PubSub } = require("apollo-server");
const { GraphQLScalarType } = require("graphql");
const { kind } = require("graphql/language");
const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://jeff-gat:imfuckingcook1@cluster0-dldya.mongodb.net/<dbname>?retryWrites=true&w=majority",
  { useNewUrlParser: true }, 
);
const db = mongoose.connection;

const movieSchema = new mongoose.Schema({
  title: String,
  releaseDate: Date,
  rating: Number,
  status: String,
  actorIds: [String],
});

const Movie = mongoose.model("Movie", movieSchema);

const typeDefs = gql`
  scalar Date
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
    releaseDate: Date
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

  input ActorInput {
    id: ID
    name: String
  }

  input MovieInput {
    id: ID
    title: String
    releaseDate: Date
    rating: Int
    status: Status
    actor: [ActorInput]
  }

  type Mutation {
    addMovie(movie: MovieInput): [Movie]
  }

  type Subscription {
    movieAdded: Movie
  }
`;

const actors = [
  {
    id: "gordon",
    name: "Gordon Liu",
  },
  {
    id: "jackie",
    name: "Jackie Chan",
  },
];

const movies = [
  {
    id: "asdfsf1asd",
    title: "Suh Dudes",
    releaseDate: new Date("10-10-2012"),
    rating: 5,
    actor: [
      {
        id: "jackie",
      },
    ],
  },
  {
    id: "asdfsccvxbcbf",
    title: "Black Shirt",
    releaseDate: new Date("10-10-2009"),
    rating: 2,
    actor: [
      {
        id: "gordon",
      },
    ],
  },
];

// Subscription stuff here
const pubsub = new PubSub()
const MOVIE_ADDED = 'MOVIE_ADDED'

const resolvers = {
  Subscription: {
    movieAdded: {
      subscribe: () => pubsub.asyncIterator([MOVIE_ADDED])
    }
  },

  Query: {
    movies: async () => {
      try {
        const allMovies = await Movie.find();
        return allMovies;
      } catch (e) {
        console.log(e);
        return [];
      }
    },

    movie: async (obj, { id }, context, info) => {
      try {
        const foundMovie = await Movie.findById(id);
        return foundMovie;
      } catch (e) {
        console.log(e);
        return [];
      }
    },
  },

  // CUSTOM RESOLVER
  Movie: {
    actor: (obj, args, context) => {
      const actorIDs = obj.actor.map((actor) => actor.id);

      const filteredActors = actors.filter((actor) => {
        return actorIDs.includes(actor.id);
      });

      return filteredActors;
    },
  },

  Mutation: {
    addMovie: async (obj, { movie }, { userId }) => {
      try {
        if (userId) {
          const newMovie = await Movie.create({
            ...movie,
          });
          pubsub.publish(MOVIE_ADDED, { movieAdded: newMovie }) // subscription
          const allMovies = await Movie.find();
          return allMovies;
        }
        return movies;
      } catch (e) {
        console.log(e);
        return [];
      }
    },
  },

  Date: new GraphQLScalarType({
    name: "Date",
    description: "a date",
    parseValue(value) {
      // value from the client
      return new Date(value);
    },
    serialize(value) {
      // value sent to the client
      return value.getTime();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value);
      }
      return null;
    },
  }),
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,

  // will see this in the context paramater in query/mutation
  context: ({ req }) => {
    const fakeUser = {
      userId: "hello",
    };
    return {
      ...fakeUser,
    };
  },
});

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("-- db connected --");

  // server
  server
    .listen({
      port: process.env.PORT || 4000,
    })
    .then(({ url }) => {
      console.log(`server started at ${url}`);
    });
});
