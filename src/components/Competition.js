import { LinearProgress } from '@material-ui/core'
import AppBar from '@material-ui/core/AppBar'
import Box from '@material-ui/core/Box'
import blue from '@material-ui/core/colors/blue'
import blueGrey from '@material-ui/core/colors/blueGrey'
import Link from '@material-ui/core/Link'
import { makeStyles } from '@material-ui/core/styles'
import Tab from '@material-ui/core/Tab'
import Tabs from '@material-ui/core/Tabs'
import Typography from '@material-ui/core/Typography'
import PropTypes from 'prop-types'
import React from 'react'
import Faq from 'react-faq-component'
import { isSignedIn } from '../logic/auth'
import { faq } from '../logic/consts'
import { getMe } from '../logic/wca-api'
import { FirebaseContext } from '../utils/firebase'
import Competitors from './Competitors'
import Info from './Info'
// import Scrambles from './Scrambles'
import Results from './Results'
import Schedule from './Schedule'

function TabPanel(props) {
	const { children, value, index, ...other } = props

	return (
		<Typography
			component='div'
			role='tabpanel'
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && <Box p={3}>{children}</Box>}
		</Typography>
	)
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.any.isRequired,
	value: PropTypes.any.isRequired,
}

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		'aria-controls': `simple-tabpanel-${index}`,
	}
}

const useStyles = makeStyles((theme) => ({
	root: {
		flexGrow: 1,
		backgroundColor: theme.palette.background.paper,
	},
}))

const tabs = {
	information: 0,
	schedule: 1,
	competitors: 2,
	scrambles: 3,
	results: 4,
	faq: 5,
	discord: 6,
}

export default function Competition({ history, match }) {
	const [competitors, setCompetitors] = React.useState(null)
	const [loading, setLoading] = React.useState(true)
	const [registered, setRegistered] = React.useState(false)
	const firebase = React.useContext(FirebaseContext)
	React.useEffect(() => {
		async function getMarkers(doc) {
			let markers = []
			await firebase
				.firestore()
				.collection('CubingAtHomeI')
				.doc(doc)
				.get()
				.then((querySnapshot) => {
					markers = querySnapshot.data().competitors
				})
			return markers
		}
		setLoading(true)
		getMarkers('Competitors').then((competitors) => {
			let allCompetitors = competitors
			getMarkers('Competitors2').then((competitors2) => {
				allCompetitors = [...allCompetitors, ...competitors2]
				if (isSignedIn()) {
					getMe().then((user) => {
						const me = allCompetitors.find(
							(competitor) => competitor.id === user.me.id
						)
						if (me) {
							setCompetitors([
								me,
								...allCompetitors.filter(
									(competitor) => competitor.id !== me.id
								),
							])
							setRegistered(true)
						} else {
							setCompetitors(allCompetitors)
						}
					})
				} else {
					setCompetitors(allCompetitors)
				}
				setLoading(false)
			})
		})
	}, [firebase])
	const classes = useStyles()

	const [value, setValue] = React.useState(match.params.tab || 'information')

	const handleChange = (event, newValue) => {
		history.push(
			`/cubing-at-home-I/${event.target.innerText.toLowerCase()}`
		)
		setValue(event.target.innerText.toLowerCase())
	}

	return (
		<div className={classes.root}>
			{!competitors || loading ? (
				<LinearProgress />
			) : (
					<>
						<AppBar color='inherit' position='static'>
							<Tabs
								scrollButtons='on'
								variant='scrollable'
								value={tabs[value]}
								onChange={handleChange}
								aria-label='simple tabs example'
							>
								<Tab label='Information' {...a11yProps(0)} />
								<Tab label='Schedule' {...a11yProps(1)} />
								<Tab label='Competitors' {...a11yProps(2)} />
								<Tab label='Results' {...a11yProps(4)} />
								<Tab label='FAQ' {...a11yProps(5)} />
								<Tab label='Discord' {...a11yProps(6)} />
							</Tabs>
						</AppBar>
						<TabPanel value={tabs[value]} index={0}>
							<Info history={history} />
						</TabPanel>
						<TabPanel value={tabs[value]} index={1}>
							<Schedule />
						</TabPanel>
						<TabPanel value={tabs[value]} index={2}>
							<Competitors
								history={history}
								competitors={competitors}
								registered={registered}
							/>
						</TabPanel>
						<TabPanel value={tabs[value]} index={4}>
							<Results />
						</TabPanel>
						<TabPanel value={tabs[value]} index={5}>
							<div>
								<Faq
									data={faq}
									styles={{
										titleTextColor: blue[500],
										rowTitleColor: blue[500],
										rowTextColor: blueGrey[500],
									}}
								/>
								<Typography
									color='primary'
									align='center'
									variant='h6'
								>
									<Link
										rel='noopener noreferrer'
										href="/contact"
									>
										Contact Us
								</Link>
								</Typography>
							</div>
						</TabPanel>
						<TabPanel value={tabs[value]} index={6}>
							<iframe
								title='discord'
								src='https://discordapp.com/widget?id=690084292323311720&theme=dark'
								width='1000vw'
								height='500vh'
								allowtransparency='true'
								frameborder='0'
							></iframe>
						</TabPanel>
					</>
				)}
		</div>
	)
}
