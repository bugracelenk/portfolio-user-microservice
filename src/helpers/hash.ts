import bcrypt from 'bcrypt';

export async function hash(value: any) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(value, salt);

  return hash;
}

export async function compare(value: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(value, hashed);
}
