import React, { Component } from 'react';
import { render } from 'react-dom';
import './style.css';
import TimeZoneMenu from './TimeZoneMenu';
import locationTranslations from './translations.locations';
import calendarTranslations from './calendarTranslations';

class App extends Component { 
  languageId = 2 // change this value to switch languages, 1 = English, 2 = Spanish

  render() {
    let translations = JSON.parse(JSON.stringify(locationTranslations[this.languageId]));
    const monthTranslations = JSON.parse(JSON.stringify(calendarTranslations[this.languageId]));
    Object.keys(monthTranslations).forEach(month => translations[month] = monthTranslations[month]);
    /*  all properties are optional
      containerStyle : style object
      menuDateTimeStyle : style object
      menuLocationStyle : style object
      menuRegionStyle : style object
      onClick : onClick() function
      onClose : onClose() function
      orderFromEastToWest : within each region, timezones are ordered either east-to-west or vice versa
      regions : controls which regions are shown, and in what order
      selectedTimeZone : selected timezone
      translations : an object that contains translation values
      warnOnFailedTranslation : will spawn a console.warn() if a translation object is passed in but the given key cannot be found in that file
    */
    return (
      <div>
        <TimeZoneMenu
          onClick={event => this.timeZoneClicked(event)}
					onClose={event => this.timeZoneClosed(event)}
					orderFromEastToWest={true}
					selectedTimeZone={'US/Alaska'}
					translations={translations}
					warnOnFailedTranslation={true}
				/>
      </div>
    );
  }

  timeZoneClicked(event) {
    // do something with the click event
  }

  timeZoneClosed(event) {
    // do something with the close event
  }
}

render(<App />, document.getElementById('root'));
