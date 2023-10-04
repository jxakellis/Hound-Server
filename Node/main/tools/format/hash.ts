import crypto from 'crypto';

function hash(string: string, salt?: string): string {
  return salt !== undefined
    ? crypto.createHash('sha256').update(string + salt).digest('hex')
    : crypto.createHash('sha256').update(string).digest('hex');
}

export { hash };
