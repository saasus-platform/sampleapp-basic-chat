import express, { Request, Response, NextFunction } from "express";
const router = express.Router();
import { getChats, postChats } from "../controllers/chat";

router.get("/", getChats);

router.post("/", postChats);

export { router };
