using System.Security.Cryptography;
using System.Text;

namespace Laputin
{
    internal interface IHasher
    {
        string Hash(string path, FileInfo fileInfo);
    }

    internal class Md5Hasher : IHasher
    {
        public string Hash(string path, FileInfo fileInfo)
        {
            const int CHUNK_SIZE = 1024;

            long input_size = fileInfo.Length;

            double offsetDouble = Math.Floor(input_size / 2.0 - CHUNK_SIZE / 2.0);
            long offset = Convert.ToInt64(offsetDouble);

            byte[] bytes = new byte[CHUNK_SIZE];

            using var md5 = MD5.Create();
            using FileStream fsSource = new FileStream(path, FileMode.Open, FileAccess.Read);
            fsSource.Seek(offset, SeekOrigin.Begin);
            fsSource.Read(bytes, 0, bytes.Length);

            var result = md5.ComputeHash(bytes);
            return ByteArrayToString(result);
        }

        private static string ByteArrayToString(byte[] ba)
        {
            StringBuilder hex = new StringBuilder(ba.Length * 2);
            int count = 0;
            foreach (byte b in ba)
            {
                hex.AppendFormat("{0:x2}", b);
                count++;
            }
            return hex.ToString().Trim();
        }
    }
}
