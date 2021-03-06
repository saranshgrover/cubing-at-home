import { Link } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'
import Ban from '@material-ui/icons/Block'
import Edit from '@material-ui/icons/Edit'
import Remove from '@material-ui/icons/RemoveCircleOutline'
import Approve from '@material-ui/icons/ThumbUp'
import moment from 'moment'
import MUIDataTable from 'mui-datatables'
import React, { useContext, useEffect, useState } from 'react'
import {
	approveFlaggedResult, banCompetitor, removeResult
} from '../../database/writes'
import { formatAttemptResult, parseActivityCode } from '../../logic/attempts'
import { activityKey } from '../../logic/consts'
import { FirebaseContext } from '../../utils/firebase'
import AdminApproveFlaggedResult from './AdminApproveFlaggedResult'
import EditResult from './EditResult'

export default function AdminResults({ competitionId }) {
	const [loading, setLoading] = useState(false)
	const firebase = useContext(FirebaseContext)
	const [edit, setEdit] = useState(null)
	const handleApprove = async (result) => {
		setLoading(true)
		await approveFlaggedResult(firebase, competitionId, result)
		setLoading(false)
	}

	const handleRemove = async (result) => {
		setLoading(true)
		await removeResult(firebase, competitionId, result.round, result)
		setLoading(false)
	}

	const handleBan = async (result) => {
		setLoading(true)
		await banCompetitor(firebase, result.personId)
		setLoading(false)
	}

	const columns = [
		{
			name: 'flaggedId',
			label: 'flaggedId',
			options: { display: 'false', print: false, download: false },
		},
		{
			name: 'personId',
			label: 'ID',
			options: { display: 'false', print: false, download: false },
		},
		{
			name: 'name',
			label: 'Name',
		},
		{
			name: 'wcaId',
			label: 'WCA ID',
			options: {
				customBodyRender: (val) => (
					<Link
						target='_blank'
						rel='noopener'
						href={`https://worldcubeassociation.org/persons/${val}`}
					>
						{val}
					</Link>
				),
			},
		},
		{
			name: 'round',
			label: 'Round ID',
			options: {
				customBodyRender: (val) => {
					const { eventId, roundNumber } = parseActivityCode(val)
					return `${activityKey[eventId]} Round ${roundNumber}`
				},
				filter: false,
			},
		},
		{
			name: 'best',
			label: 'Single',
			options: {
				customBodyRender: (val, tableMeta) =>
					formatAttemptResult(
						val,
						parseActivityCode(tableMeta.rowData[2]).eventId
					),
				filter: false,
			},
		},
		{
			name: 'average',
			label: 'Average',
			options: {
				customBodyRender: (val, tableMeta) =>
					formatAttemptResult(
						val,
						parseActivityCode(tableMeta.rowData[2]).eventId,
						true
					),
			},
		},
		{
			name: 'attempts',
			label: 'Attempts',
			options: {
				customBodyRender: (val, tableMeta) =>
					val
						.map((solve) =>
							formatAttemptResult(
								solve,
								parseActivityCode(tableMeta.rowData[2]).eventId
							)
						)
						.join(', '),
			},
		},
		{
			name: 'lastUpdated',
			label: 'Last Updated',
			options: {
				customBodyRender: (val) => moment(val.toDate()).format('LT'),
			},
		},
		{
			name: 'reason',
			label: 'Reason',
			options: {},
		},
		{
			name: 'Approve',
			label: 'Approve',
			options: {
				download: false,
				print: false,
				sort: false,
				filter: false,
				customBodyRender: (value, tableMeta, rowIndex) => (
					<IconButton
						disabled={loading}
						onClick={() => handleApprove(results[tableMeta.rowData[0]])}
					>
						<Approve />
					</IconButton>
				),
			},
		},
		{
			name: 'Edit',
			label: 'Edit',
			options: {
				download: false,
				print: false,
				sort: false,
				filter: false,
				customBodyRender: (value, tableMeta, rowIndex) => (
					<IconButton
						disabled={loading}
						onClick={() => setEdit(results[tableMeta.rowData[0]])}
					>
						<Edit />
					</IconButton>
				),
			},
		},
		{
			name: 'Remove',
			label: 'Remove',
			options: {
				download: false,
				print: false,
				sort: false,
				filter: false,
				customBodyRender: (value, tableMeta, rowIndex) => (
					<IconButton
						disabled={loading}
						onClick={() => handleRemove(results[tableMeta.rowData[0]])}
					>
						<Remove />
					</IconButton>
				),
			},
		},
		{
			name: 'Ban',
			label: 'Ban',
			options: {
				download: false,
				print: false,
				sort: false,
				filter: false,
				customBodyRender: (value, tableMeta, rowIndex) => (
					<IconButton
						disabled={loading}
						onClick={() => handleBan(results[tableMeta.rowData[0]])}
					>
						<Ban />
					</IconButton>
				),
			},
		},
	]

	const [results, setResults] = useState({})
	useEffect(() => console.log(results), [results])
	const subscribeToFlaggedResults = () => {
		return firebase
			.firestore()
			.collection('competitions')
			.doc(competitionId)
			.collection('Flagged_Results')
			.orderBy('lastUpdated')
			.onSnapshot((snapshot) => {
				let newResults = {}
				snapshot.forEach((doc) => {
					const data = doc.data()
					data.flaggedId = `${data.personId}-${data.round}`
					newResults[`${data.personId}-${data.round}`] = data
				})
				setResults(newResults)
			})
	}
	useEffect(() => {
		const unsubscribe = subscribeToFlaggedResults()
		return () => unsubscribe()
	}, [])

	return (
		<>
			{edit && (
				<EditResult
					competitionId={competitionId}
					result={edit}
					onComplete={() => setEdit(null)}
				/>
			)}
			<MUIDataTable
				title='Flagged Competitors'
				data={Object.values(results)}
				columns={columns}
				options={{
					customToolbarSelect: (selectedRows, displayData, setSelectedRows) => (
						<AdminApproveFlaggedResult
							results={displayData}
							setSelectedRows={setSelectedRows}
							competitionId={competitionId}
						/>
					),
				}}
			/>
		</>
	)
}
