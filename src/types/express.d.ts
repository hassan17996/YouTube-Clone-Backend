// Add user to the req ==> req.user 

export {}; // make the file => separate module

// means => I will edit or add something in ts
declare global {
  // focus on the part which the type we wanna edit in
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        isVerified: boolean;
      };
    }
  }
};

