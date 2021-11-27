// See https://aka.ms/new-console-template for more information
using System.Security.Cryptography;
using System.Text;

static string ByteArrayToString(byte[] ba)
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

var pathSource = @"file.mp4";

long input_size = new System.IO.FileInfo(pathSource).Length;
const int CHUNK_SIZE = 1024;

var foo = input_size / 2.0;
var bar = CHUNK_SIZE / 2.0;

double offsetDouble = Math.Floor(foo - bar);
long offset = Convert.ToInt64(offsetDouble);

byte[] bytes = new byte[CHUNK_SIZE];

using var md5 = MD5.Create();
using FileStream fsSource = new FileStream(pathSource, FileMode.Open, FileAccess.Read);
fsSource.Seek(offset, SeekOrigin.Begin);
fsSource.Read(bytes, 0, bytes.Length);


var result = md5.ComputeHash(bytes);
var stringResult = ByteArrayToString(result);



Console.WriteLine($"{pathSource} = {stringResult}");
