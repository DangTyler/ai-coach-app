import { supabase } from "../lib/supabase";

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

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  if (supabase) {
    const { error } = await supabase.from("users").insert({
      id,
      email: normalizedEmail,
      name: name.trim(),
      password_hash: passwordHash,
    });
    if (error) {
      if (error.code === "23505") throw new Error("An account with this email already exists");
      throw new Error(error.message);
    }
    const token = generateToken();
    await supabase.from("tokens").insert({ token, user_id: id });
    console.log(`[Auth] User registered (Supabase): ${normalizedEmail} (${id})`);
    return { id, email: normalizedEmail, name: name.trim(), token };
  }

  for (const user of users.values()) {
    if (user.email === normalizedEmail) {
      throw new Error("An account with this email already exists");
    }
  }
  users.set(id, { id, email: normalizedEmail, name: name.trim(), passwordHash });
  const token = generateToken();
  tokens.set(token, id);
  console.log(`[Auth] User registered (memory): ${normalizedEmail} (${id})`);
  return { id, email: normalizedEmail, name: name.trim(), token };
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await hashPassword(password);

  if (supabase) {
    const { data: rows, error } = await supabase
      .from("users")
      .select("id, email, name, password_hash")
      .eq("email", normalizedEmail)
      .limit(1);
    if (error) throw new Error(error.message);
    const user = rows?.[0] as { id: string; email: string; name: string; password_hash: string } | undefined;
    if (!user || user.password_hash !== passwordHash) {
      throw new Error("Invalid email or password");
    }
    const token = generateToken();
    await supabase.from("tokens").insert({ token, user_id: user.id });
    console.log(`[Auth] User logged in (Supabase): ${normalizedEmail}`);
    return { id: user.id, email: user.email, name: user.name, token };
  }

  let foundUser: { id: string; email: string; name: string; passwordHash: string } | null = null;
  for (const user of users.values()) {
    if (user.email === normalizedEmail && user.passwordHash === passwordHash) {
      foundUser = user;
      break;
    }
  }
  if (!foundUser) throw new Error("Invalid email or password");
  const token = generateToken();
  tokens.set(token, foundUser.id);
  console.log(`[Auth] User logged in (memory): ${normalizedEmail}`);
  return { id: foundUser.id, email: foundUser.email, name: foundUser.name, token };
}

export async function getUserFromToken(token: string): Promise<{ id: string; email: string; name: string } | null> {
  if (supabase) {
    const { data: tokenRow, error: tokenError } = await supabase
      .from("tokens")
      .select("user_id")
      .eq("token", token)
      .limit(1)
      .single();
    if (tokenError || !tokenRow) return null;
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", tokenRow.user_id)
      .limit(1)
      .single();
    if (userError || !user) return null;
    return { id: user.id, email: user.email, name: user.name };
  }

  const userId = tokens.get(token);
  if (!userId) return null;
  const user = users.get(userId);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export async function invalidateToken(token: string) {
  if (supabase) {
    await supabase.from("tokens").delete().eq("token", token);
    return;
  }
  tokens.delete(token);
}

export async function updateUserProfile(userId: string, updates: { name?: string }) {
  if (supabase) {
    const payload: { name?: string } = {};
    if (updates.name) payload.name = updates.name.trim();
    if (Object.keys(payload).length === 0) {
      const { data } = await supabase.from("users").select("id, email, name").eq("id", userId).single();
      if (!data) throw new Error("User not found");
      return { id: data.id, email: data.email, name: data.name };
    }
    const { data, error } = await supabase.from("users").update(payload).eq("id", userId).select("id, email, name").single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("User not found");
    return { id: data.id, email: data.email, name: data.name };
  }

  const user = users.get(userId);
  if (!user) throw new Error("User not found");
  if (updates.name) user.name = updates.name.trim();
  users.set(userId, user);
  return { id: user.id, email: user.email, name: user.name };
}
