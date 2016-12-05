using DanfossFCC.Droid;
using System;
using Xamarin.Forms;

[assembly: Dependency (typeof (BaseUrl_Android))]

namespace DanfossFCC.Droid
{
	public class BaseUrl_Android : IBaseUrl 
	{
		public string Get () 
		{
			return "file:///android_asset/";
		}
	}
}