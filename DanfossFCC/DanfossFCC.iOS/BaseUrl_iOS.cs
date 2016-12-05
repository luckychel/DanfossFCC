using DanfossFCC.iOS;
using Foundation;
using Xamarin.Forms;

[assembly: Dependency (typeof (BaseUrl_iOS))]

namespace DanfossFCC.iOS
{
	public class BaseUrl_iOS : IBaseUrl 
	{
		public string Get () 
		{
			return NSBundle.MainBundle.BundlePath;
		}
	}
}