const users = new Map<string, { id: string; email: string; name: string; passwordHash: string }>();
const tokens = new Map<string, string>();

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "rork-salt-v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function registerUser(email: string, password: string, name: string) {
  const normalizedEmail = email.toLowerCase().trim();

  for (const user of users.values()) {
    if (user.email === normalizedEmail) {
      throw new Error("An account with this email already exists");
    }
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  users.set(id, { id, email: normalizedEmail, name: name.trim(), passwordHash });

  const token = generateToken();
  tokens.set(token, id);

  console.log(`[Auth] User registered: ${normalizedEmail} (${id})`);

  return { id, email: normalizedEmail, name: name.trim(), token };
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await hashPassword(password);

  let foundUser: { id: string; email: string; name: string; passwordHash: string } | null = null;

  for (const user of users.values()) {
    if (user.email === normalizedEmail && user.passwordHash === passwordHash) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken();
  tokens.set(token, foundUser.id);

  console.log(`[Auth] User logged in: ${normalizedEmail}`);

  return { id: foundUser.id, email: foundUser.email, name: foundUser.name, token };
}

export function getUserFromToken(token: string) {
  const userId = tokens.get(token);
  if (!userId) return null;

  const user = users.get(userId);
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name };
}

export function invalidateToken(token: string) {
  tokens.delete(token);
}

export function updateUserProfile(userId: string, updates: { name?: string }) {
  const user = users.get(userId);
  if (!user) throw new Error("User not found");

  if (updates.name) {
    user.name = updates.name.trim();
  }

  users.set(userId, user);
  return { id: user.id, email: user.email, name: user.name };
}
