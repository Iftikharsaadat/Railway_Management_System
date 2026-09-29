const bookingService = require('../services/bookingService');

const respond = (res, work, successStatus = 200) => work().then(data => res.status(successStatus).json(data)).catch(error => {
  console.error('Booking API error:', error.message);
  res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Internal Server Error' });
});

const id = value => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const userId = req => id(req.user?.account_id);
const journeyInput = body => ({ schedule_id: body.schedule_id, train_id: body.train_id, date: body.date, from_station_id: body.from_station_id, to_station_id: body.to_station_id });

exports.availableSeats = (req,res) => respond(res, async () => {
  const input = journeyInput(req.query);
  if (!id(input.from_station_id) || !id(input.to_station_id) || (!id(input.schedule_id) && (!id(input.train_id) || !input.date))) throw Object.assign(new Error('Provide schedule_id or train_id and date, plus from_station_id and to_station_id.'), { statusCode:400 });
  return bookingService.getAvailableSeats(input);
});

exports.lockSeat = async (req,res) => {
  try {
    if (!userId(req)) throw Object.assign(new Error('Valid authenticated account required.'),{statusCode:401});
    if (!id(req.body.seat_id) || !id(req.body.from_station_id) || !id(req.body.to_station_id)) throw Object.assign(new Error('seat_id, from_station_id, and to_station_id are required.'),{statusCode:400});
    const result = await bookingService.addSeatLock(userId(req), { ...journeyInput(req.body), seat_id:id(req.body.seat_id) });
    res.status(result.unlocked ? 200 : 201).json(result);
  } catch(error) {
    console.error('Booking API error:',error.message);
    res.status(error.statusCode || 500).json({error:error.statusCode ? error.message : 'Internal Server Error'});
  }
};

exports.unlockSeat = (req,res) => respond(res, async () => {
  if (!userId(req) || !id(req.params.lock_id)) throw Object.assign(new Error('Valid lock_id and authenticated account are required.'),{statusCode:400});
  return bookingService.removeSeatLock(userId(req), id(req.params.lock_id));
});

exports.myLocks = (req,res) => respond(res, async () => {
  if (!userId(req)) throw Object.assign(new Error('Valid authenticated account required.'),{statusCode:401});
  const input = journeyInput(req.query);
  if (!id(input.from_station_id) || !id(input.to_station_id) || (!id(input.schedule_id) && (!id(input.train_id) || !input.date))) throw Object.assign(new Error('Journey details are required.'),{statusCode:400});
  return bookingService.getUserActiveLocks(userId(req),input);
});

exports.createBooking = (req,res) => respond(res, async () => {
  if (!userId(req)) throw Object.assign(new Error('Valid authenticated account required.'),{statusCode:401});
  return bookingService.createBooking(userId(req),{...journeyInput(req.body),seat_ids:req.body.seat_ids});
},201);

exports.validateSelection = (req,res) => respond(res, async () => {
  if (!userId(req)) throw Object.assign(new Error('Valid authenticated account required.'),{statusCode:401});
  return bookingService.validateSelection(userId(req),{...journeyInput(req.body),seat_ids:req.body.seat_ids});
});

exports.confirmPayment = (req,res) => respond(res, async () => {
  if (!userId(req) || !id(req.params.ticket_id)) throw Object.assign(new Error('Valid ticket_id and authenticated account are required.'),{statusCode:400});
  return bookingService.confirmPayment(userId(req),id(req.params.ticket_id),req.body.method);
});

exports.ticket = (req,res) => respond(res, async () => {
  if (!userId(req) || !id(req.params.ticket_id)) throw Object.assign(new Error('Valid ticket_id and authenticated account are required.'),{statusCode:400});
  return bookingService.getTicket(userId(req),id(req.params.ticket_id));
});

exports.myTickets = (req,res) => respond(res, async () => {
  if (!userId(req)) throw Object.assign(new Error('Valid authenticated account required.'),{statusCode:401});
  return bookingService.getMyTickets(userId(req));
});

exports.cancelTicket = (req,res) => respond(res, async () => {
  if (!userId(req) || !id(req.params.ticket_id)) throw Object.assign(new Error('Valid ticket_id and authenticated account are required.'),{statusCode:400});
  return bookingService.cancelTicket(userId(req), id(req.params.ticket_id));
});

const makePdf = lines => {
  const esc = text => String(text ?? '').replace(/[^\x20-\x7E]/g,'?').replace(/([\\()])/g,'\\$1');
  const content = `BT\n/F1 12 Tf\n50 790 Td\n${lines.map((line,i)=>`${i ? '0 -22 Td\n' : ''}(${esc(line)}) Tj`).join('\n')}\nET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  ];
  let pdf='%PDF-1.4\n'; const offsets=[0];
  objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});
  const xref=Buffer.byteLength(pdf); pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset=>{pdf+=`${String(offset).padStart(10,'0')} 00000 n \n`;});
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
};

exports.ticketPdf = async (req,res) => {
  try {
    if (!userId(req) || !id(req.params.ticket_id)) return res.status(400).json({error:'Valid ticket_id and authenticated account are required.'});
    const ticket=await bookingService.getTicket(userId(req),id(req.params.ticket_id));
    if (ticket.status !== 'booked' || ticket.payment_status !== 'paid') return res.status(409).json({error:'Ticket is not confirmed and paid.'});
    const lines=[`RAILWAY TICKET #${ticket.ticket_id}`,`Passenger: ${ticket.purchaser_name}`,`Train: ${ticket.train_name}`,`Journey: ${ticket.from_station} to ${ticket.to_station}`,`Date: ${String(ticket.date).slice(0,10)} ${ticket.starting_time || ''}`,`Seats: ${ticket.seats.map(s=>`${s.coach}-${s.seat_number} (${s.seat_type})`).join(', ')}`,`Total: ${ticket.amount}`,`Payment: ${ticket.payment_status} (${ticket.method || ''})`];
    res.setHeader('Content-Type','application/pdf'); res.setHeader('Content-Disposition',`attachment; filename="ticket-${ticket.ticket_id}.pdf"`); res.send(makePdf(lines));
  } catch(error) { res.status(error.statusCode || 500).json({error:error.statusCode ? error.message : 'Internal Server Error'}); }
};
