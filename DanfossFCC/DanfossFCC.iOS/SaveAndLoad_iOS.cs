using System;
using Xamarin.Forms;
using DanfossFCC.iOS;
using System.IO;
using System.Threading.Tasks;
using DanfossFCC;
using Foundation;
using System.Linq;
using UIKit;
using CoreGraphics;
using Java.Lang;

[assembly: Dependency (typeof(SaveAndLoad_iOS))]

namespace DanfossFCC.iOS
{
	public class SaveAndLoad_iOS : ISaveAndLoad
	{
		public static string DocumentsPath {
			get {
				var documentsDirUrl = NSFileManager.DefaultManager.GetUrls (NSSearchPathDirectory.DocumentDirectory, NSSearchPathDomain.User).Last ();
				return documentsDirUrl.Path;
			}
		}

		#region ISaveAndLoad implementation

		public async Task SaveTextAsync (string filename, string text)
		{
			string path = CreatePathToFile (filename);
			using (StreamWriter sw = File.CreateText(path))
				await sw.WriteAsync(text);
		}

		public async Task<string> LoadTextAsync (string filename)
		{
			string path = CreatePathToFile (filename);
			using (StreamReader sr = File.OpenText(path))
				return await sr.ReadToEndAsync();
		}

		public bool FileExists (string filename)
		{
			return File.Exists (CreatePathToFile (filename));
		}

		#endregion

		static string CreatePathToFile(string fileName)
		{
			return Path.Combine (DocumentsPath, fileName);
		}


        public void TakeScreenShot() {

            //UIImage image;
            //CGRect screenBounds = UIScreen.MainScreen.Bounds;
            //nfloat screenScale = UIScreen.MainScreen.Scale;

            //UIGraphics.BeginImageContext(new CGSize(screenBounds.Size.Width * screenScale, screenBounds.Size.Height * screenScale));
            //image = UIGraphics.GetImageFromCurrentImageContext();
            //UIGraphics.EndImageContext();

            //image.SaveToPhotosAlbum((img, err) => {
            //    if (err != null)
            //        Console.WriteLine("error saving image: {0}", err);
            //    else
            //        Console.WriteLine("image saved to photo album");
            //});
        }
    }
}