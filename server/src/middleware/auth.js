import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const token = req.cookies?.promptvault_token;
  if (!token) {
    return res.status(401).json({ message: "Inicia sesion para continuar." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ message: "La sesion no es valida o ha expirado." });
  }
}

export function optionalAuthentication(req, _res, next) {
  const token = req.cookies?.promptvault_token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub };
    } catch {
      req.user = undefined;
    }
  }
  next();
}
