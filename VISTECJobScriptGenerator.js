/*****************************************************************\

Copyright (C) 2014, Brigham Young University

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.

*******************************************************************

Available at: https://github.com/BYUHPC/BYUJobScriptGenerator

Author:  Ryan Cox <ryan_cox@byu.edu>

This script generator was originally created for Brigham Young University and
is tailored to its specific needs and configuration.  It is unlikely that this
script will work for you without modification since there are many, many ways
to configure a job scheduler.

This should integrate easily into any existing website.  Use CSS for styling.

TODO:
	job arrays
	tooltip/help for each parameter row

\*****************************************************************/



/*****************************************************************\

Modified By, Bundit Boonyarit <bundit.b_s18@vistec.ac.th>
Scalable Data Systems Lab (SCADS)
School of Information Science and Technology (IST),
Vidyasirimedhi Institute of Science and Technology (VISTEC)
2018

\*****************************************************************/



var VISTECScriptGen = function(div) {
	this.values = {};
	this.containerDiv = div;
	this.inputs = {};
	this.inputs.features = {};
	this.formrows = [];
	this.settings = {
		defaults : {
			email_address : "myemail@vistec.ac.th", //example.com should be blackholed
		},
		/* You may want to dynamically generate features/queue. See example HTML file */
		queue : {},
		queue_status : {},
	};
	return this;
};

VISTECScriptGen.prototype.returnNewRow = function (rowid, left, right) {
	var l, r, tr;
	l = document.createElement("td");
	r = document.createElement("td");
	tr = document.createElement("tr");
	l.id = rowid + "_left";
	r.id = rowid + "_right";
	tr.id = rowid;
	l.innerHTML = left;
	r.appendChild(right)
	tr.appendChild(l);
	tr.appendChild(r);
	return tr;
}

VISTECScriptGen.prototype.newCheckbox = function(args) {
	var tthis = this;
	var newEl = document.createElement("input");
	newEl.type = "checkbox";
	var formrows = this.formrows;
	if(args.checked)
		newEl.checked = true;
	if(args.toggle)
		newEl.onclick = newEl.onchange = function () {
			formrows[args.toggle].style.display = newEl.checked ? "" : "none";
			tthis.updateJobscript();
		};
	else
		newEl.onclick = newEl.onchange = function () {
			tthis.updateJobscript();
		};
	return newEl;
}

VISTECScriptGen.prototype.newInput = function(args) {
	var tthis = this;
	var newEl = document.createElement("input");
	newEl.type = "text";
	if(args.size)
		newEl.size = args.size;
	if(args.maxLength)
		newEl.maxLength = args.maxLength;
	if(args.value)
		newEl.value = args.value;
	newEl.onclick = newEl.onchange = function () {
		tthis.updateJobscript();
	};
	return newEl;
}

VISTECScriptGen.prototype.newSelect = function(args) {
	var tthis = this;
	var newEl = document.createElement("select");
	if(args.options) {
		for(var i in args.options) {
			var newOpt = document.createElement("option");
			newOpt.value = args.options[i][0];
			newOpt.text = args.options[i][1];
			if(args.selected && args.selected == args.options[i][0])
				newOpt.selected = true;
			newEl.appendChild(newOpt);
		}
	}
	newEl.onclick = newEl.onchange = function () {
		tthis.updateJobscript();
	};
	return newEl;
}

VISTECScriptGen.prototype.newSpan = function() {
	var newEl = document.createElement("span");
	if(arguments[0])
		newEl.id = arguments[0];
	for (var i = 1; i < arguments.length; i++) {
		if(typeof arguments[i] == "string") {
			newEl.appendChild(document.createTextNode(arguments[i]));
		} else
			newEl.appendChild(arguments[i]);
	}
	return newEl;
};

VISTECScriptGen.prototype.newA = function(url, body) {
	var a = document.createElement("a");
	a.href = url;
	a.appendChild(document.createTextNode(body));
	a.target = "_base";
	return a;
}

VISTECScriptGen.prototype.createForm = function(doc) {
	function br() {
		return document.createElement("br");
	}
	function newHeaderRow(text) {
		var headertr = document.createElement("tr");
		var headerth = document.createElement("th");
		headerth.colSpan = 2;
		headerth.appendChild(document.createTextNode(text));
		headertr.appendChild(headerth);
		return headertr;
	}

	var newEl;
	form = document.createElement("form");
	var table = document.createElement("table");
	form.appendChild(table);
	table.appendChild(newHeaderRow("PBS Pro Script Generator @Galaxy Cluster"));

	this.inputs.node = this.newInput({value:1});
	this.inputs.num_cores = this.newInput({value:1});
	this.inputs.num_gpus = this.newInput({value:0});
	this.inputs.mem_per_core = this.newInput({value:0});
	this.inputs.mem_units = this.newSelect({options:[["GB", "GB"],["MB", "MB"]]});
	this.inputs.job_name = this.newInput({});
	this.inputs.email_begin = this.newCheckbox({checked:0});
	this.inputs.email_end = this.newCheckbox({checked:0});
	this.inputs.email_abort = this.newCheckbox({checked:0});
	this.inputs.email_address = this.newInput({value:this.settings.defaults.email_address, size:30});
	this.inputs.mpirun_true = this.newCheckbox({checked:0});
	this.inputs.mpirun_false = this.newCheckbox({checked:0});
	
	this.inputs.queue = [];
	if(this.settings.queue.show) {
		var queue_span = this.newSpan("vistec_sg_input_queue");
		for(var i in this.settings.queue.names) {
			var new_checkbox = this.newCheckbox({checked:0});
			new_checkbox.queue_name = this.settings.queue.names[i];
			this.inputs.queue.push(new_checkbox);
			var url = this.newA(this.settings.queue.info_base_url + this.settings.queue.names[i], "");
			var queue_container = this.newSpan(null);
			queue_container.className = "vistec_sg_input_queue_container";
			var name_span = this.newSpan("vistec_sg_input_queue_" + new_checkbox.queue_name, new_checkbox, this.settings.queue.names[i]);
			name_span.className = "vistec_sg_input_queue_name";
			queue_container.appendChild(name_span);
			if(this.settings.queue_status && this.settings.queue_status[this.settings.queue.names[i]]) {
				var queue_status = this.settings.queue_status[this.settings.queue.names[i]];
				queue_container.appendChild(
					this.newSpan(	null,
							"Nodes avail: ",
							queue_status.nodes_free + "/" + queue_status.nodes_total,
							br(),
							"Cores avail: ",
							queue_status.cores_free + "/" + queue_status.cores_total
					)
				);
			}
			queue_span.appendChild(queue_container);
		}
		table.appendChild(this.returnNewRow("vistec_sg_input_queue", "Queue: ", queue_span));
	}
	
	table.appendChild(this.returnNewRow("vistec_sg_row_mpirun", "Use MPI Process:",
				this.newSpan( 	null,
						this.inputs.mpirun_true,
						" Yes ",
						this.inputs.mpirun_false,
						" No "
						)
			)
	);		
	table.appendChild(this.returnNewRow("vistec_sg_row_onenode", "Number of node(s): ", this.inputs.node));
	table.appendChild(this.returnNewRow("vistec_sg_row_numcores", "Number of processor cores <b>across all nodes</b>: ", this.inputs.num_cores));
	table.appendChild(this.returnNewRow("vistec_sg_row_numgpus", "Number of GPUs: ", this.inputs.num_gpus));
	table.appendChild(this.returnNewRow("vistec_sg_row_mempercore", "Memory per processor core: ", this.newSpan(null, this.inputs.mem_per_core, this.inputs.mem_units)));
	table.appendChild(this.returnNewRow("vistec_sg_row_jobname", "Job name: ", this.inputs.job_name));
	table.appendChild(this.returnNewRow("vistec_sg_row_emailevents", "Receive email for job events: ", 
				this.newSpan(	null,
						this.inputs.email_begin,
						" Begin ",
						this.inputs.email_end,
						" End ",
						this.inputs.email_abort,
						" Abort"
					    )
			 )
	);
	table.appendChild(this.returnNewRow("vistec_sg_row_emailaddress", "Email address: <br> [Message will be located at SPAM or JUNK folder]", this.inputs.email_address));
	
	return form;

}; /* end createForm() */

VISTECScriptGen.prototype.retrieveValues = function() {
	var jobnotes = [];
	this.values.MB_per_core = Math.round(this.inputs.mem_per_core.value * (this.inputs.mem_units.value =="GB" ? 1024 : 1));

	this.values.features = [];
	for(var i in this.inputs.features) {
		if(this.inputs.features[i].checked){
			this.values.features.push(this.inputs.features[i].feature_name);
		} else {
		}
	}

	this.values.queue = [];
	for(var i in this.inputs.queue) {
		if(this.inputs.queue[i].checked){
			this.values.queue.push(this.inputs.queue[i].queue_name);
		} else {
		}
	}

	this.values.num_cores = this.inputs.num_cores.value;
	this.values.nodes = this.inputs.node;
	this.values.gpus = this.inputs.num_gpus.value;
	this.values.job_name = this.inputs.job_name.value;
	this.values.sendemail = {};
	this.values.sendemail.begin = this.inputs.email_begin.checked;
	this.values.sendemail.end = this.inputs.email_end.checked;
	this.values.sendemail.abort = this.inputs.email_abort.checked;
	this.values.email_address = this.inputs.email_address.value;
	this.values.mpirun_true = this.inputs.mpirun_true.checked;
	this.values.mpirun_false = this.inputs.mpirun_false.checked;
	
	this.values.nodes = Math.round(this.inputs.node.value);
	this.values.gpus = Math.round(this.inputs.num_gpus.value);
	this.values.num_cores = Math.round(this.inputs.num_cores.value);
	this.values.mpirun_true = Math.round(this.inputs.mpirun_true.checked);
	this.values.mpirun_false = Math.round(this.inputs.mpirun_false.checked);
	
	/* Add warnings, etc. to jobnotes array */
	if(this.values.MB_per_core > 32*1024)
		jobnotes.push("Are you crazy? That is way too much RAM!");
	if(this.values.MB_per_core > 32*1024 && this.values.queue.indexOf("qcpu") > -1)
		jobnotes.push("<B>qcpu</B> queue nodes have 32 GB of RAM. You want more than that per core.");
	if(this.values.MB_per_core > 32*1024 && this.values.queue.indexOf("qgpu") > -1)
		jobnotes.push("<B>qgpu</B> queue nodes have 32 GB of RAM. You want more than that per core.");
	if(this.values.nodes > 3 && this.values.queue.indexOf("qcpu") > -1)
		jobnotes.push("<B>qcpu</B> queue nodes have maximum available 3 nodes per job.");
	if(this.values.nodes > 1 && this.values.queue.indexOf("qgpu") > -1)
		jobnotes.push("<B>qgpu</B> queue nodes have maximum available 1 nodes per job.");
	if(this.values.gpus > 2 && this.values.queue.indexOf("qgpu") > -1)
		jobnotes.push("<B>qgpu</B> queue gpu have maximum available 2 gpu per job.");
	if(this.values.gpus > 0 && this.values.queue.indexOf("qcpu") > -1)
		jobnotes.push("<B>qcpu</B> queue is not available gpu execution.");
	if(this.values.num_cores > 12 && this.values.queue.indexOf("qcpu") > -1)
		jobnotes.push("<B>qcpu</B> queue have maximum available 12 cores/node/job.");
	if(this.values.num_cores > 6 && this.values.queue.indexOf("qgpu") > -1)
		jobnotes.push("<B>qgpu</B> queue have maximum available 6 cores/node/job.");
	if(this.values.queue.indexOf("qcpu") && this.values.queue.indexOf("qgpu") != 0)
		jobnotes.push("Please select <B>qcpu</B> or <B>qgpu</B> queue for execution");
	if(this.values.queue.indexOf("qcpu") > -1 && this.values.queue.indexOf("qgpu") > -1)
		jobnotes.push("Please select <B>qcpu</B> or <B>qgpu</B> option, only 1 queue for execution");
	if(this.values.queue.indexOf("qgpu") > -1 && this.values.gpus == 0)
		jobnotes.push("Please define <B>Number of GPUs</B> for <B>qgpu</B> queue");
	if(this.values.mpirun_true == 0 && this.values.mpirun_false == 0)
		jobnotes.push("Please select <B>MPI Process</B>");
	if(this.values.mpirun_true !=0 && this.values.mpirun_false != 0)
		jobnotes.push("Please select <B>MPI Process</B> only one option, <B>Yes</B> or <B>No</B>");


	this.jobNotesDiv.innerHTML = jobnotes.join("<br/>\n");
};

VISTECScriptGen.prototype.generateScriptPBS = function () {
	this.retrieveValues();

		if(this.values.queue[0] == "qgpu" && this.values.mpirun_false != 0) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: qsub thefilename\n\n##################### PBS Head #######################\n#######Auto Generated By Galaxy Cluster@VISTEC########\n\n";
		scr +=  "# set shell that interprets the job script \n#PBS -S /bin/bash\n"

		if(this.inputs.node.value > 0)
			procs = "select=" + this.inputs.node.value + ":" + "ncpus=" + this.values.num_cores;

		if(this.inputs.mem_per_core.value > 0)
			procs += ":mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.num_gpus.value > 0)
			procs += ":ngpus=" + this.inputs.num_gpus.value;
		
		if(this.values.queue.length > 0)
			scr += "\n# set queue that is destination of the job\n" + "#PBS -q " + "qgpu" + "\n";
		
		scr += "\n# set the number of nodes and processes per node\n" + "#PBS -l " + procs + "\n";
		scr += "\n# use submission environment\n#PBS -V\n";
		
		if(this.inputs.job_name.value != "") {
			scr += "\n# set name of job\n" + "#PBS -N " + this.inputs.job_name.value + "\n";
		}

		if(this.inputs.email_begin.checked || this.inputs.email_end.checked || this.inputs.email_abort.checked) {
			var emailletters = [];
			if(this.inputs.email_begin.checked)
				emailletters.push("b");
			if(this.inputs.email_end.checked)
				emailletters.push("e");
			if(this.inputs.email_abort.checked)
				emailletters.push("a");
			scr += "\n# mail alert at (b)eginning, (e)nd and (a)bortion of execution\n#PBS -m " + emailletters.join("") + "\n";
			scr += "\n# send mail to the following address\n#PBS -M " + this.inputs.email_address.value + "\n";
			if(this.inputs.email_address.value == this.settings.defaults.email_address)
				scr += "echo \"$USER: Please change the -M option to your real email address before submitting. Then remove this line.\"; exit 1\n";
		}
	
		scr += "\n# start job from the directory it was submitted\ncd $PBS_O_WORKDIR\n";
		scr += "\n######################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";

		return scr;
	}
	
	
	if(this.values.queue[0] == "qgpu" && this.values.mpirun_true != 0) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: qsub thefilename\n\n##################### PBS Head #######################\n#######Auto Generated By Galaxy Cluster@VISTEC########\n\n";
		scr +=  "# set shell that interprets the job script \n#PBS -S /bin/bash\n"

		if(this.inputs.node.value > 0)
			procs = "select=" + this.inputs.node.value + ":" + "ncpus=" + this.values.num_cores + ":" + "mpiprocs=" + this.values.num_cores;

		if(this.inputs.mem_per_core.value > 0)
			procs += ":mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.num_gpus.value > 0)
			procs += ":ngpus=" + this.inputs.num_gpus.value;

		if(this.values.queue.length > 0)
			scr += "\n# set queue that is destination of the job\n" + "#PBS -q " + "qgpu" + "\n";
		
		scr += "\n# set the number of nodes and processes per node\n" + "#PBS -l " + procs + "\n";
		scr += "\n# use submission environment\n#PBS -V\n";
		
		if(this.inputs.job_name.value != "") {
			scr += "\n# set name of job\n" + "#PBS -N " + this.inputs.job_name.value + "\n";
		}

		if(this.inputs.email_begin.checked || this.inputs.email_end.checked || this.inputs.email_abort.checked) {
			var emailletters = [];
			if(this.inputs.email_begin.checked)
				emailletters.push("b");
			if(this.inputs.email_end.checked)
				emailletters.push("e");
			if(this.inputs.email_abort.checked)
				emailletters.push("a");
			scr += "\n# mail alert at (b)eginning, (e)nd and (a)bortion of execution\n#PBS -m " + emailletters.join("") + "\n";
			scr += "\n# send mail to the following address\n#PBS -M " + this.inputs.email_address.value + "\n";
			if(this.inputs.email_address.value == this.settings.defaults.email_address)
				scr += "echo \"$USER: Please change the -M option to your real email address before submitting.\n";
		}
	
		scr += "\n# start job from the directory it was submitted\ncd $PBS_O_WORKDIR\n";
		scr += "\n######################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\nmpirun -np " + this.inputs.node.value*this.values.num_cores + " INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";

		return scr;
	}
	
	
	if(this.values.queue[0] == "qcpu" && this.values.mpirun_false != 0) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: qsub thefilename\n\n##################### PBS Head #######################\n#######Auto Generated By Galaxy Cluster@VISTEC########\n\n";
		scr +=  "# set shell that interprets the job script \n#PBS -S /bin/bash\n"

		if(this.inputs.node.value > 0)
			procs = "nodes=" + this.inputs.node.value + ":" + "ppn=" + this.values.num_cores;

		if(this.inputs.mem_per_core.value > 0)
			procs += ":" + "pmem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;
		
		if(this.values.queue.length > 0)
			scr += "\n# set queue that is destination of the job\n" + "#PBS -q " + "qcpu" + "\n";
		
		scr += "\n# set the number of nodes and processes per node\n" + "#PBS -l " + procs + "\n";
		scr += "\n# use submission environment\n#PBS -V\n";
		
		if(this.inputs.job_name.value != "") {
			scr += "\n# set name of job\n" + "#PBS -N " + this.inputs.job_name.value + "\n";
		}

		if(this.inputs.email_begin.checked || this.inputs.email_end.checked || this.inputs.email_abort.checked) {
			var emailletters = [];
			if(this.inputs.email_begin.checked)
				emailletters.push("b");
			if(this.inputs.email_end.checked)
				emailletters.push("e");
			if(this.inputs.email_abort.checked)
				emailletters.push("a");
			scr += "\n# mail alert at (b)eginning, (e)nd and (a)bortion of execution\n#PBS -m " + emailletters.join("") + "\n";
			scr += "\n# send mail to the following address\n#PBS -M " + this.inputs.email_address.value + "\n";
			if(this.inputs.email_address.value == this.settings.defaults.email_address)
				scr += "echo \"$USER: Please change the -M option to your real email address before submitting. Then remove this line.\"; exit 1\n";
		}
	
		scr += "\n# start job from the directory it was submitted\ncd $PBS_O_WORKDIR\n";
		scr += "\n######################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";

		return scr;
	}
	
	if(this.values.queue[0] == "qcpu" && this.values.mpirun_true != 0) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: qsub thefilename\n\n##################### PBS Head #######################\n#######Auto Generated By Galaxy Cluster@VISTEC########\n\n";
		scr +=  "# set shell that interprets the job script \n#PBS -S /bin/bash\n"

		if(this.inputs.node.value > 0)
			procs = "select=" + this.inputs.node.value + ":" + "ncpus=" + this.values.num_cores + ":" + "mpiproc=" + this.values.num_cores;

		if(this.inputs.mem_per_core.value > 0)
			procs += ":" + "mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;
		
		if(this.values.queue.length > 0)
			scr += "\n# set queue that is destination of the job\n" + "#PBS -q " + "qcpu" + "\n";
		
		scr += "\n# set the number of nodes and processes per node\n" + "#PBS -l " + procs + "\n";
		scr += "\n# use submission environment\n#PBS -V\n";
		
		if(this.inputs.job_name.value != "") {
			scr += "\n# set name of job\n" + "#PBS -N " + this.inputs.job_name.value + "\n";
		}

		if(this.inputs.email_begin.checked || this.inputs.email_end.checked || this.inputs.email_abort.checked) {
			var emailletters = [];
			if(this.inputs.email_begin.checked)
				emailletters.push("b");
			if(this.inputs.email_end.checked)
				emailletters.push("e");
			if(this.inputs.email_abort.checked)
				emailletters.push("a");
			scr += "\n# mail alert at (b)eginning, (e)nd and (a)bortion of execution\n#PBS -m " + emailletters.join("") + "\n";
			scr += "\n# send mail to the following address\n#PBS -M " + this.inputs.email_address.value + "\n";
			if(this.inputs.email_address.value == this.settings.defaults.email_address)
				scr += "echo \"$USER: Please change the -M option to your real email address before submitting. Then remove this line.\"; exit 1\n";
		}
	
		scr += "\n# start job from the directory it was submitted\ncd $PBS_O_WORKDIR\n";
		scr += "\n######################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\nmpirun -np " + this.inputs.node.value*this.values.num_cores + " INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";

		return scr;
	}

};

function stackTrace() {
    var err = new Error();
    return err.stack;
}

VISTECScriptGen.prototype.updateJobscript = function() {
	this.retrieveValues();
	this.toJobScript();
	return;
};

VISTECScriptGen.prototype.init = function() {
	this.inputDiv = document.createElement("div");
	this.inputDiv.id = "vistec_sg_input_container";
	this.containerDiv.appendChild(this.inputDiv);

	var scriptHeader = document.createElement("h1");
	scriptHeader.id = "vistec_sg_script_header";
	scriptHeader.appendChild(document.createTextNode("Job Script"));
	this.containerDiv.appendChild(scriptHeader);

	this.form = this.createForm();
	this.inputDiv.appendChild(this.form);

	this.jobNotesDiv = document.createElement("div");
	this.jobNotesDiv.id = "vistec_sg_jobnotes";
	this.containerDiv.appendChild(this.jobNotesDiv);

	this.jobScriptDiv = document.createElement("div");
	this.jobScriptDiv.id = "vistec_sg_jobscript";
	this.containerDiv.appendChild(this.jobScriptDiv);

	this.updateJobscript();
};

VISTECScriptGen.prototype.toJobScript = function() {
	scr = this.generateScriptPBS();	
	this.jobScriptDiv.innerHTML = "<pre>" + scr + "</pre>";
};
