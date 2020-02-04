import Button from 'material-ui/Button';
import Menu, {MenuItem} from 'material-ui/Menu';
import moment from 'moment-timezone-all';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

class TimeZoneMenu extends Component {
	constructor(props) {
		super(props);
		this.state = {
			anchorElement : null,
			selectedTimeZone : null,
			timeZoneChosen : false,
		};
		this.duplicatedLocations = [
			'Argentina/Buenos Aires',
			'Argentina/Catamarca',
			'Argentina/Cordoba',
			'Argentina/Jujuy',
			'Argentina/Mendoza',
			'Indiana/Indianapolis',
			'Indiana/Knox',
			'Kentucky/Louisville',
			'Lord Howe',
			'Kolkata',
			'Faeroe',
			'Kathmandu',
			'Macao',
			'Asmera',
			'Dawson',
			'Chungking',
		];
		this.nonRegions = ['Etc', 'Universal', 'Zulu'];
		this.rawTimeZones = moment.tz.names();
		this.regions = ['US', 'Africa', 'America', 'Antarctica', 'Asia', 'Atlantic', 'Australia', 'Brazil', 'Canada', 'Chile', 'Europe', 'Indian', 'Mexico', 'Pacific'];
		this.regionsMasterList = ['US', 'Africa', 'America', 'Antarctica', 'Asia', 'Atlantic', 'Australia', 'Brazil', 'Canada', 'Chile', 'Europe', 'Indian', 'Mexico', 'Pacific'];
		this.removeLocationPrefixes = ['Argentina', 'Indiana', 'Kentucky', 'North Dakota'];
		this.selectedTimeZoneDisplayName = null;
		this.warnings = {};
	}
	
	static getDerivedStateFromProps(props, state) {
		if (props.selectedTimeZone !== state.selectedTimeZone && !state.timeZoneChosen) {
			state.selectedTimeZone = props.selectedTimeZone;
		}
		if (state.timeZoneChosen) {
			state.timeZoneChosen = false;
		}
		return state;
	}

	buildTimeZones() {
		this.timeZones = [];
		this.rawTimeZones.forEach(timeZone => {
			const timeZonePieces = timeZone.split('/');
			const region = timeZonePieces[0];
			if (!this.regions.some(configuredRegion => configuredRegion === region)) { return; }
			const replaceThis = region + '/';
			let location = timeZone.replace(replaceThis, '');
			location = location.replace(/_/g, ' ');
			location = location.replace('St ', 'St. ');
			location = this.properlySpaceTheLocation(location);
			if (location === 'Dumont DUrville') { location = 'Dumont d\'Urville'; }
			if (this.duplicatedLocations.some(duplicate => duplicate === location)) { return; }
			this.removeLocationPrefixes.forEach(prefix => {
				const replaceThis = prefix + '/';
				location = location.replace(replaceThis, '');
			});
			const translatedLocation = this.translate(location);
			this.timeZones.push(
				{
					location : location,
					name : timeZone,
					offset : moment().tz(timeZone).utcOffset(),
					region : region,
					translatedLocation : translatedLocation,
				},
			);
		});
	}

	handleClick(event) {
		this.setState({anchorElement : event.currentTarget});
		if (this.props.onClick) { this.props.onClick(event); }
	}

	handleClose(event) {
		this.setState(
			{
				anchorElement : null,
				selectedTimeZone : event.currentTarget.getAttribute('timezone'),
				timeZoneChosen : true,
			}
		);
		if (this.props.onClose) { this.props.onClose(event); }
	}

	isIgnoredCharacter(character) {
		return [' ', '/', '-', '.'].some(ignoredCharacter => ignoredCharacter === character)
	}

	populateMenuItems() {
		this.menuItems = [];
		const orderFromEastToWest = this.orderFromEastToWest;
		this.regions.forEach(region => {
			if (!this.regionsMasterList.some(masterListRegion => masterListRegion === region)) {
				this.warn(`The region [${region}] is not supported.`);
				return;
			}
			const timeZones = this.timeZones.filter(timeZone => timeZone.region === region);
			timeZones.sort(function(a, b) {
				if (a.offset !== b.offset) { return orderFromEastToWest ? b.offset - a.offset : a.offset - b.offset; }
				if (a.translatedLocation < b.translatedLocation) { return -1; }
				else if (a.translatedLocation > b.translatedLocation) { return 1; }
				else { return 0; }
			});
			const translatedRegion = this.translate(region);
			this.menuItems.push(
				<MenuItem
					disabled={true}
					key={region}
					style={this.menuRegionStyle}
				>
					{translatedRegion}
				</MenuItem>,
			);
			let previousOffset = 999;
			let hours = '';
			timeZones.forEach(timeZone => {
				if (timeZone.offset !== previousOffset) {
					let dateTime = moment().tz(timeZone.name).format('MMMM DD, HH:mm');
					const dateTimePieces = dateTime.split(' ');
					const englishMonth = dateTimePieces[0];
					const translatedMonth = this.translate(englishMonth);
					if (englishMonth !== translatedMonth) { dateTime = dateTime.replace(englishMonth, translatedMonth); }
					let offset = timeZone.offset;
					hours = Math.floor(offset / 60);
					if (hours < 10 && hours > -10) {
						if (hours < 0) {
							hours = hours.toString();
							hours = hours.replace('-', 'GMT-0');
						} else if (hours > 0) {
							hours = 'GMT+0' + hours;
						} else { hours = 'GMT+' + hours; }
					} else if (hours >= 10) {
						hours = 'GMT+' + hours;
					} else if (hours <= -10) {
						hours = 'GMT' + hours;
					}
					hours += ':';
					let minutes = Math.abs(offset % 60);
					if (minutes < 10) { minutes = '0' + minutes; }
					hours += minutes;
					this.menuItems.push(
						<MenuItem
							disabled={true}
							key={region + dateTime}
							style={this.menuDateTimeStyle}
						>
							{dateTime} ({hours})
						</MenuItem>,
					);
				}
				const fullLocationDisplayName = `${translatedRegion} - ${timeZone.translatedLocation} (${hours})`;
				if (timeZone.name === this.state.selectedTimeZone) {
					this.selectedTimeZoneDisplayName = fullLocationDisplayName;
				}
				this.menuItems.push(
					<MenuItem
						timezonedisplayname={fullLocationDisplayName}
						key={timeZone.name}
						onClick={event => this.handleClose(event)}
						timezone={timeZone.name}
						selected={timeZone.name === this.state.selectedTimeZone}
						style={this.menuLocationStyle}
					>
						{timeZone.translatedLocation}
					</MenuItem>,
				);
				previousOffset = timeZone.offset;
			});
		});
	}

	processProps() {
		if (this.props.menuDateTimeStyle) {
			this.menuDateTimeStyle = this.props.menuDateTimeStyle;
		} else {
			this.menuDateTimeStyle = {
				fontSize : '0.95em',
				fontWeight : 500,
				opacity : 0.9,
				paddingBottom : '0px',
				paddingLeft : '32px',
				paddingTop : '0px',
			};
		}
		if (this.props.menuRegionStyle) {
			this.menuRegionStyle = this.props.menuRegionStyle;
		} else {
			this.menuRegionStyle = {
				fontSize : '1em',
				fontWeight : 500,
				opacity : 1,
				paddingBottom : '0px',
				paddingTop : '10px',
			};
		}
		if (this.props.menuLocationStyle) {
			this.menuLocationStyle = this.props.menuLocationStyle;
		} else {
			this.menuLocationStyle = {
				fontSize : '0.9em',
				paddingBottom : '0px',
				paddingLeft : '48px',
				paddingTop : '0px',
			};
		}
		if (typeof this.props.orderFromEastToWest === 'boolean') {
			this.orderFromEastToWest = this.props.orderFromEastToWest;
		} else { this.orderFromEastToWest = true; }
		if (this.props.regions && this.props.regions.length) { this.regions = this.props.regions; }
		if (this.props.translations) {
			this.translations = this.props.translations;
		} else { this.translations = {}; }
	}

	properlySpaceTheLocation(name) {
		let properlySpacedNamed = '';
		let previousCharacter = '';
		for (let character of name) {
			if (
				previousCharacter !== ''
				&& !this.isIgnoredCharacter(previousCharacter)
				&& !this.isIgnoredCharacter(character)
				&& previousCharacter !== ' '
				&& previousCharacter === previousCharacter.toLowerCase()
				&& character === character.toUpperCase()
			) {
				properlySpacedNamed += ' ';
			}
			properlySpacedNamed += character;
			previousCharacter = character;
		}
		return properlySpacedNamed;
	}

	render() {
		this.processProps();
		this.buildTimeZones();
		this.populateMenuItems();
		const {anchorElement} = this.state;
		const displayName = this.selectedTimeZoneDisplayName ? this.selectedTimeZoneDisplayName : this.translate('Select a Timezone');
		return (
			<div style={this.props.containerStyle}>
				<Button
					aria-haspopup={true}
					aria-owns={anchorElement ? 'timeZoneMenu' : null}
					onClick={event => this.handleClick(event)}
				>
					{displayName}
				</Button>
				<Menu
					anchorEl={anchorElement}
					id={'timeZoneMenu'}
					onClose={event => this.handleClose(event)}
					open={!!anchorElement}
				>
					{this.menuItems}
				</Menu>
			</div>
		);
	}

	translate(english) {
		if (!this.translations.hasOwnProperty(english)) {
			if (this.props.warnOnFailedTranslation) { this.warn(`No translation found for [${english}]`); }
			return english;
		}
		return this.translations[english];
	}

	warn(warning) {
		if (!this.warnings.hasOwnProperty(warning)) {
			this.warnings[warning] = true;
			console.warn(warning);
		}
	}
}

TimeZoneMenu.propTypes = {
	containerStyle : PropTypes.object,
	menuDateTimeStyle : PropTypes.object,
	menuLocationStyle : PropTypes.object,
	menuRegionStyle : PropTypes.object,
	onClick : PropTypes.func,
	onClose : PropTypes.func,
	orderFromEastToWest : PropTypes.bool,
	regions : PropTypes.array,
	selectedTimeZone : PropTypes.string,
	translations : PropTypes.object,
	warnOnFailedTranslation : PropTypes.bool,
};
export default TimeZoneMenu;
