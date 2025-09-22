// MODULE IMPORT
const dotenv = require("dotenv");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const _ = require("lodash");
const action = require("./info_doc/action.json");
const node = require("./info_doc/node.json");
const resourceTemplate = require("./info_doc/resourceTemplate.json");
const response = require("./info_doc/response.json");
const trigger = require("./info_doc/trigger.json");

// ENV SECRETS
dotenv.config();
const SECRET = process.env.JWT_SECRET || "redit";
const PORT = process.env.PORT || 3000;
const USER_NAME = process.env.USER_NAME || "alice";
const PASSWORD = process.env.PASSWORD || "admin";

// Schema
const typeDefs = `#graphql
    scalar Long
    scalar JSON 

    type Action {
        _id: ID!
        createdAt: Long!
        updatedAt: Long
        name: String!
        description: String
        functionString: String
        resourceTemplateId: ID

        resourceTemplate: ResourceTemplate
    }

    type Trigger {
        _id: ID!
        createdAt: Long!
        updatedAt: Long
        name: String!
        description: String
        functionString: String
        resourceTemplateId: ID

        resourceTemplate: ResourceTemplate
    }

    type Response {
        _id: ID!
        createdAt: Long!
        updatedAt: Long
        name: String!
        description: String

        platforms: [ResponsePlatform]
    }

    type ResponsePlatform {
        integrationId: ID
        build: Int

        localeGroups: [ResponseLocaleGroup]
    }

    type ResponseLocaleGroup {
        localeGroupId: ID
        variations: [ResponseVariation]
    }

    type ResponseVariation {
        name: String!
        responses: JSON
    }

    type ResourceTemplate {
        _id: ID!
        createdAt: Long!
        updatedAt: Long
        name: String!
        description: String
        schema: JSON
        integrationId: String
        functionString: String

        key: String
    }

    type NodeObject {
        _id: ID!
        createdAt: Long!
        updatedAt: Long
        name: String!
        description: String
        parents: [NodeObject]
        parentIds: [ID]
        root: Boolean
        trigger: Trigger
        triggerId: ID
        responses: [Response]
        responseIds: [ID]
        actions: [Action]
        actionIds: [ID]
        priority: Float
        compositeId: ID
        global: Boolean
        colour: String
    }

    type Query {
        node(nodeId: ID): NodeObject
    }

    type Mutation {
        login(username: String!, password: String!): String!
    }
`;

// Resolvers
const resolvers = {
  Query: {
    node: (__, { nodeId }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      const n = _.find(node, { _id: nodeId });
      if (!n) return null;

      // Resolve parents
      const parents = (n.parents || []).map((pid) =>
        _.find(node, { compositeId: pid })
      );

      // Resolve trigger
      const trig = n.trigger ? _.find(trigger, { _id: n.trigger }) : null;
      if (trig) {
        trig.resourceTemplate =
          _.find(resourceTemplate, { _id: trig.resourceTemplateId }) || null;
      }

      // Resolve responses
      const resps = (n.responses || []).map((rid) => {
        const r = _.find(response, { _id: rid });
        return r || null;
      });

      // Resolve actions and postActions
      const acts = (n.actions || []).map((aid) => {
        const a = _.find(action, { _id: aid });
        if (a) {
          a.resourceTemplate =
            _.find(resourceTemplate, { _id: a.resourceTemplateId }) || null;
        }
        return a || null;
      });

      //   If necessary post actions
      const postActs = (n.postActions || []).map((aid) => {
        const a = _.find(action, { _id: aid });
        if (a) {
          a.resourceTemplate =
            _.find(resourceTemplate, { _id: a.resourceTemplateId }) || null;
        }
        return a || null;
      });

      return {
        ...n,
        parents,
        parentIds: n.parents || [],
        trigger: trig,
        triggerId: n.trigger || null,
        responses: resps,
        responseIds: n.responses || [],
        actions: acts,
        actionIds: n.actions || [],
      };
    },
  },
  Mutation: {
    login: (__, { username, password }) => {
      if (username === USER_NAME && password === PASSWORD) {
        return jwt.sign({ username }, SECRET, { expiresIn: "1h" });
      }
      throw new Error("Invalid credentials");
    },
  },
};

const context = async ({ req }) => {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    try {
      const token = auth.replace("Bearer ", "");
      const decoded = jwt.verify(token, SECRET);
      return { user: decoded };
    } catch {
      return {};
    }
  }
  return {};
};

(async () => {
  const server = new ApolloServer({ typeDefs, resolvers });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT || 3000 },
    context,
  });

  console.log(`Server ready at ${url}`);
})();
