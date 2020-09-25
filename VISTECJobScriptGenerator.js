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
	this.containerDiv2 = div;
	this.inputs = {};
	this.inputs.features = {};
	this.formrows = [];
	this.settings = {
		defaults : {
			email_address : "myemail@vistec.ac.th", //example.com should be blackholed
		},
		/* You may want to dynamically generate features/partition. See example HTML file */
		partition : {},
		partition_status : {},
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

	/* Create Form */

	var newEl;
	form = document.createElement("form");
	var table = document.createElement("table");
	form.appendChild(table);
	table.appendChild(newHeaderRow("SLURM Script Generator @Galaxy Cluster"));

	
	this.inputs.single_node = this.newCheckbox({checked:1});
	this.inputs.num_cores = this.newInput({value:1});
	this.inputs.num_gpus = this.newInput({value:0});
	this.inputs.mem_per_core = this.newInput({value:0});
	this.inputs.mem_units = this.newSelect({options:[["GB", "GB"],["MB", "MB"]]});
	this.inputs.wallhours = this.newInput({value:"0", size:3});
	this.inputs.wallmins = this.newInput({value:"00", size:2, maxLength:2});
	this.inputs.wallsecs = this.newInput({value:"00", size:2, maxLength:2});
	this.inputs.job_name = this.newInput({});
	this.inputs.mpirun_true = this.newCheckbox({checked:0});
	this.inputs.mpirun_false = this.newCheckbox({checked:0});
	this.inputs.chdir = this.newInput({});
	this.inputs.partition = [];

	table.appendChild(this.returnNewRow("vistec_sg_row_onenode", "Limit this job to one node: ", this.inputs.single_node));	

	if(this.settings.partition.show) {
		var partition_span = this.newSpan("vistec_sg_input_partition");
		for(var i in this.settings.partition.names) {
			var new_checkbox = this.newCheckbox({checked:0});
			new_checkbox.partition_name = this.settings.partition.names[i];
			this.inputs.partition.push(new_checkbox);
			var partition_container = this.newSpan(null);
			partition_container.className = "vistec_sg_input_partition_container";
			var name_span = this.newSpan("vistec_sg_input_partition_" + new_checkbox.partition_name, new_checkbox, this.settings.partition.names[i]);
			name_span.className = "vistec_sg_input_partition_name";
			partition_container.appendChild(name_span);
			partition_span.appendChild(partition_container);
		}
		table.appendChild(this.returnNewRow("vistec_sg_input_partition", "Partition: ", partition_span));
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
		
	table.appendChild(this.returnNewRow("vistec_sg_row_numcores", "Number of processor cores <B>across all nodes</B>: ", this.inputs.num_cores));
	table.appendChild(this.returnNewRow("vistec_sg_row_numgpus", "Number of GPUs: ", this.inputs.num_gpus));
	table.appendChild(this.returnNewRow("vistec_sg_row_mempercore", "Memory per node: ", this.newSpan(null, this.inputs.mem_per_core, this.inputs.mem_units)));
	table.appendChild(this.returnNewRow("vistec_sg_row_walltime", "Walltime: ", this.newSpan(null, this.inputs.wallhours, " hours ", this.inputs.wallmins, " mins ", this.inputs.wallsecs, " secs")));
	table.appendChild(this.returnNewRow("vistec_sg_row_jobname", "Job name: ", this.inputs.job_name));
	table.appendChild(this.returnNewRow("vistec_sg_row_chdir", "Working directory: ", this.inputs.chdir));
	
	return form;

}; /* end createForm() */

VISTECScriptGen.prototype.retrieveValues = function() {
	var jobnotes = [];
	this.values.MB_per_core = Math.round(this.inputs.mem_per_core.value * (this.inputs.mem_units.value =="GB" ? 1024 : 1));

	this.values.partition = [];
	for(var i in this.inputs.partition) {
		if(this.inputs.partition[i].checked){
			this.values.partition.push(this.inputs.partition[i].partition_name);
		} else {
		}
	}

	this.values.num_cores = this.inputs.num_cores.value;
	if(this.inputs.single_node.checked)
		this.values.nodes = 1;
	this.values.gpus = this.inputs.num_gpus.value;
	this.values.walltime_in_minutes = this.inputs.wallhours.value * 3600 + this.inputs.wallmins.value * 60;
	this.values.job_name = this.inputs.job_name.value;
	this.values.mpirun_true = this.inputs.mpirun_true.checked;
	this.values.mpirun_false = this.inputs.mpirun_false.checked;
	this.values.gpus = Math.round(this.inputs.num_gpus.value);
	this.values.num_cores = Math.round(this.inputs.num_cores.value);
	this.values.mpirun_true = Math.round(this.inputs.mpirun_true.checked);
	this.values.mpirun_false = Math.round(this.inputs.mpirun_false.checked);
	this.values.chdir = this.inputs.chdir.value;
	
	/* Add warnings, RAM */
	if(this.values.MB_per_core > 64*1024)
		jobnotes.push("Are you crazy? That is way too much RAM!");
	if(this.values.MB_per_core > 64*1024 && this.values.partition.indexOf("CPU") > -1)
		jobnotes.push("<B>CPU</B> partition, nodes have miximum RAM to 64 GB. You want more than that per core.");
	if(this.values.MB_per_core > 64*1024 && this.values.partition.indexOf("GPU_GTX1070Ti") > -1)
		jobnotes.push("<B>GPU_GTX1070Ti</B> partition, nodes have miximum RAM to 64 GB of RAM. You want more than that per core.");
	if(this.values.MB_per_core > 64*1024 && this.values.partition.indexOf("GPU_RTX2070") > -1)
		jobnotes.push("<B>GPU_RTX2070</B> partition, nodes have miximum RAM to 64 GB of RAM. You want more than that per core.");
	if(this.values.MB_per_core > 32*1024 && this.values.partition.indexOf("GPU_RTX2080") > -1)
		jobnotes.push("<B>GPU_RTX2080</B> partition, nodes have miximum RAM to 32 GB of RAM. You want more than that per core.");

	/* Add warnings, GPU */
	if(this.values.gpus > 4 && this.values.partition.indexOf("GPU_GTX1070Ti") > -1)
		jobnotes.push("<B>GPU_GTX1070Ti</B> partition, gpus have maximum available 4 gpus per job.");
	if(this.values.gpus > 2 && this.values.partition.indexOf("GPU_RTX2070") > -1)
		jobnotes.push("<B>GPU_RTX2070</B> partition, gpus have maximum available 2 gpus per job.");
	if(this.values.gpus > 1 && this.values.partition.indexOf("GPU_RTX2080") > -1)
		jobnotes.push("<B>GPU_RTX2080</B> partition, gpu has maximum available 1 gpu per job.");

	/* Add warnings, CPU CORES */
	if(this.values.num_cores > 80 && this.values.partition.indexOf("CPU") > -1)
		jobnotes.push("<B>CPU</B> partition have maximum available 80 cores for all nodes.");
	if(this.values.num_cores > 20 && this.values.partition.indexOf("GPU_GTX1070Ti") > -1)
		jobnotes.push("<B>GPU_GTX1070Ti</B> partition have maximum available 20 cores for all nodes.");
	if(this.values.num_cores > 12 && this.values.partition.indexOf("GPU_RTX2070") > -1)
		jobnotes.push("<B>GPU_RTX2070</B> partition have maximum available 12 cores for all nodes.");
	if(this.values.num_cores > 16 && this.values.partition.indexOf("GPU_RTX2080") > -1)
		jobnotes.push("<B>GPU_RTX2080</B> partition have maximum available 16 cores for all nodes.");
	if(this.values.num_cores > 16 && this.values.mpirun_false != 0)
		jobnotes.push("<B>MPI process</B> must required for CPU cores > 16 cores.");

	/* Add warnings, NODE */	
	if(this.inputs.single_node.checked && this.values.num_cores > 16)
		jobnotes.push("<B>CPU cores</B> have maximum available 16 cores for single node.");

	/* Add warnings, PARTITIONS */
	if(this.values.gpus > 0 && this.values.partition.indexOf("CPU") > -1)
		jobnotes.push("<B>CPU</B> partition is not available for gpu execution.");
	if(this.values.partition.indexOf("CPU") && this.values.partition.indexOf("GPU_GTX1070Ti") && this.values.partition.indexOf("GPU_RTX2070") && this.values.partition.indexOf("GPU_RTX2080") != 0)
		jobnotes.push("Please select <B>CPU, GPU_GTX1070Ti, GPU_RTX2070, or GPU_RTX2080</B> partition for execution");
	if(this.values.partition.indexOf("CPU") > -1 && (this.values.partition.indexOf("GPU_GTX1070Ti") > -1 || this.values.partition.indexOf("GPU_RTX2070") > -1 || this.values.partition.indexOf("GPU_RTX2080") > -1))
		jobnotes.push("Please select <B>CPU or GPU</B> option for execution");
	if(this.values.partition.indexOf("GPU_GTX1070Ti") > -1 && (this.values.partition.indexOf("GPU_RTX2070") > -1 || this.values.partition.indexOf("GPU_RTX2080") > -1))
		jobnotes.push("Please select only <B>1 GPU</B> partition for execution");	
	else if(this.values.partition.indexOf("GPU_RTX2070") > -1 && (this.values.partition.indexOf("GPU_GTX1070Ti") > -1 || this.values.partition.indexOf("GPU_RTX2080") > -1))
		jobnotes.push("Please select only <B>1 GPU</B> partition for execution");	
	else if(this.values.partition.indexOf("GPU_RTX2080") > -1 && (this.values.partition.indexOf("GPU_GTX1070Ti") > -1 || this.values.partition.indexOf("GPU_RTX2070") > -1))
		jobnotes.push("Please select only <B>1 GPU</B> partition for execution");		
	if((this.values.partition.indexOf("GPU_GTX1070Ti") > -1 || this.values.partition.indexOf("GPU_RTX2070") > -1 || this.values.partition.indexOf("GPU_RTX2080") > -1) && this.values.gpus == 0)
		jobnotes.push("Please define <B>Number of GPUs</B> for <B>GPU</B> partition");

	/* Add warnings, MPI */
	if(this.values.mpirun_true == 0 && this.values.mpirun_false == 0)
		jobnotes.push("Please select <B>MPI Process</B>");
	if(this.values.mpirun_true !=0 && this.values.mpirun_false != 0)
		jobnotes.push("Please select <B>MPI Process</B> only one option, <B>Yes</B> or <B>No</B>");

	/* Add warnings, Walltime */
	if(this.values.walltime_in_minutes > 86400*5 && this.values.partition.indexOf("CPU") > -1)
		jobnotes.push("<B>CPU</B> partition maximum walltime is 5 days");
	if(this.values.walltime_in_minutes > 86400*3 && (this.values.partition.indexOf("GPU_GTX1070Ti") > -1 || this.values.partition.indexOf("GPU_RTX2070") > -1 || this.values.partition.indexOf("GPU_RTX2080") > -1))
		jobnotes.push("<B>GPU</B> partition maximum walltime is 3 days");

	this.jobNotesDiv.innerHTML = jobnotes.join("<br/>\n");
};

VISTECScriptGen.prototype.generateScriptSLURM = function () {
	this.retrieveValues();

	/* Add SLURM script for GPU_GTX1070Ti partition with no MPI */

	if(this.values.partition[0] == "GPU_GTX1070Ti" && this.values.mpirun_false != 0 && this.values.gpus > 0 && this.values.gpus < 5) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n##################### SLURM Head #######################\n########Auto Generated By Galaxy Cluster@VISTEC#########\n";

		if(this.inputs.single_node.checked)
			scr += "\n# set the number of nodes to single \n" + "#SBATCH --nodes=1 \n";

		if(this.values.num_cores > 0)
			scr += "\n# set the number of cpu per task\n" + "#SBATCH --cpus-per-task=" + this.values.num_cores + "\n";

		if(this.values.partition.length > 0)
			scr += "\n# set partition that is destination of the job\n" + "#SBATCH --partition=qgpu_gtx1070ti\n";

		if(this.inputs.mem_per_core.value > 0)
			scr += "\n# set the number of memory per node\n" + "#SBATCH --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value + "\n";

		if(this.inputs.num_gpus.value > 0)
			scr += "\n# set the number of GPU\n" + "#SBATCH --gres=gpu:" + this.inputs.num_gpus.value + "\n";

		if(this.inputs.wallhours.value > 0)
			scr += "\n# set walltime\n" + "#SBATCH --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "\n";

		if(this.inputs.job_name.value != "")
			scr += "\n# set name of job\n" + "#SBATCH --job-name=" + this.inputs.job_name.value + "\n";

		if(this.inputs.chdir.value != "")
			scr += "\n# set working directory\n" + "#SBATCH --chdir=\"" + this.inputs.chdir.value + "\"\n";

		scr += "\n########################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";

		return scr;
	}
	
	/* Add SLURM script for GPU_RTX2070 partition with no MPI */

	if(this.values.partition[0] == "GPU_RTX2070" && this.values.mpirun_false != 0 && this.values.gpus > 0 && this.values.gpus < 3) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n##################### SLURM Head #######################\n########Auto Generated By Galaxy Cluster@VISTEC#########\n";

		if(this.inputs.single_node.checked)
			scr += "\n# set the number of nodes to single \n" + "#SBATCH --nodes=1 \n";
			
		if(this.values.num_cores > 0)
			scr += "\n# set the number of cpu per task\n" + "#SBATCH --cpus-per-task=" + this.values.num_cores + "\n";

		if(this.values.partition.length > 0)
			scr += "\n# set partition that is destination of the job\n" + "#SBATCH --partition=qgpu_rtx2070\n";

		if(this.inputs.mem_per_core.value > 0)
			scr += "\n# set the number of memory per node\n" + "#SBATCH --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value + "\n";

		if(this.inputs.num_gpus.value > 0)
			scr += "\n# set the number of GPU\n" + "#SBATCH --gres=gpu:" + this.inputs.num_gpus.value + "\n";
		
		if(this.inputs.wallhours.value > 0)
			scr += "\n# set walltime\n" + "#SBATCH --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "\n";
		
		if(this.inputs.job_name.value != "")
			scr += "\n# set name of job\n" + "#SBATCH --job-name=" + this.inputs.job_name.value + "\n";
		
		if(this.inputs.chdir.value != "") 
			scr += "\n# set working directory\n" + "#SBATCH --chdir=\"" + this.inputs.chdir.value + "\"\n";
	
		scr += "\n########################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";

		return scr;
	}

	/* Add SLURM script for GPU_RTX2080 partition with no MPI */

	if(this.values.partition[0] == "GPU_RTX2070" && this.values.mpirun_false != 0 && this.values.gpus > 0 && this.values.gpus < 2) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n##################### SLURM Head #######################\n########Auto Generated By Galaxy Cluster@VISTEC#########\n";

		if(this.inputs.single_node.checked)
			scr += "\n# set the number of nodes to single \n" + "#SBATCH --nodes=1 \n";
			
		if(this.values.num_cores > 0)
			scr += "\n# set the number of cpu per task\n" + "#SBATCH --cpus-per-task=" + this.values.num_cores + "\n";

		if(this.values.partition.length > 0)
			scr += "\n# set partition that is destination of the job\n" + "#SBATCH --partition=qgpu_rtx2080\n";

		if(this.inputs.mem_per_core.value > 0)
			scr += "\n# set the number of memory per node\n" + "#SBATCH --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value + "\n";

		if(this.inputs.num_gpus.value > 0)
			scr += "\n# set the number of GPU\n" + "#SBATCH --gres=gpu:" + this.inputs.num_gpus.value + "\n";
		
		if(this.inputs.wallhours.value > 0)
			scr += "\n# set walltime\n" + "#SBATCH --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "\n";
		
		if(this.inputs.job_name.value != "")
			scr += "\n# set name of job\n" + "#SBATCH --job-name=" + this.inputs.job_name.value + "\n";
		
		if(this.inputs.chdir.value != "") 
			scr += "\n# set working directory\n" + "#SBATCH --chdir=\"" + this.inputs.chdir.value + "\"\n";
	
		scr += "\n########################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";

		return scr;
	}

	/* Add SLURM script for GPU_GTX1070Ti partition with MPI */

	if(this.values.partition[0] == "GPU_GTX1070Ti" && this.values.mpirun_true != 0 && this.values.gpus > 0 && this.values.gpus < 5) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n##################### SLURM Head #######################\n########Auto Generated By Galaxy Cluster@VISTEC#########\n";

		if(this.inputs.single_node.checked)
			scr += "\n# set the number of nodes to single \n" + "#SBATCH --nodes=1 \n";
			
		if(this.values.num_cores > 0)
			scr += "\n# set the number of task all nodes\n" + "#SBATCH --ntasks=" + this.values.num_cores + "\n";

		if(this.values.partition.length > 0)
			scr += "\n# set partition that is destination of the job\n" + "#SBATCH --partition=qgpu_gtx1070ti\n";

		if(this.inputs.mem_per_core.value > 0)
			scr += "\n# set the number of memory per node\n" + "#SBATCH --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value + "\n";

		if(this.inputs.num_gpus.value > 0)
			scr += "\n# set the number of GPU\n" + "#SBATCH --gres=gpu:" + this.inputs.num_gpus.value + "\n";
		
		if(this.inputs.wallhours.value > 0)
			scr += "\n# set walltime\n" + "#SBATCH --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "\n";
		
		if(this.inputs.job_name.value != "")
			scr += "\n# set name of job\n" + "#SBATCH --job-name=" + this.inputs.job_name.value + "\n";
		
		if(this.inputs.chdir.value != "") 
			scr += "\n# set working directory\n" + "#SBATCH --chdir=\"" + this.inputs.chdir.value + "\"\n";
	
		scr += "\n########################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\nmodule load openmpi3\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n";
		scr += "\nsrun --mpi=pmix_v2 -n " + this.values.num_cores + " ./yourprogram\n\n";
		return scr;
	}
	
	/* Add SLURM script for GPU_RTX2070 partition with MPI */

	if(this.values.partition[0] == "GPU_RTX2070" && this.values.mpirun_true != 0 && this.values.gpus > 0 && this.values.gpus < 3) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n##################### SLURM Head #######################\n########Auto Generated By Galaxy Cluster@VISTEC#########\n";

		if(this.inputs.single_node.checked)
			scr += "\n# set the number of nodes to single \n" + "#SBATCH --nodes=1 \n";
			
		if(this.values.num_cores > 0)
			scr += "\n# set the number of task all nodes\n" + "#SBATCH --ntasks=" + this.values.num_cores + "\n";

		if(this.values.partition.length > 0)
			scr += "\n# set partition that is destination of the job\n" + "#SBATCH --partition=qgpu_rtx2070\n";

		if(this.inputs.mem_per_core.value > 0)
			scr += "\n# set the number of memory per node\n" + "#SBATCH --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value + "\n";

		if(this.inputs.num_gpus.value > 0)
			scr += "\n# set the number of GPU\n" + "#SBATCH --gres=gpu:" + this.inputs.num_gpus.value + "\n";
		
		if(this.inputs.wallhours.value > 0)
			scr += "\n# set walltime\n" + "#SBATCH --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "\n";
		
		if(this.inputs.job_name.value != "")
			scr += "\n# set name of job\n" + "#SBATCH --job-name=" + this.inputs.job_name.value + "\n";
		
		if(this.inputs.chdir.value != "") 
			scr += "\n# set working directory\n" + "#SBATCH --chdir=\"" + this.inputs.chdir.value + "\"\n";	
	
		scr += "\n########################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\nmodule load openmpi3\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n";
		scr += "\nsrun --mpi=pmix_v2 -n " + this.values.num_cores + " ./yourprogram\n\n";
		return scr;
	}
	
	/* Add SLURM script for GPU_RTX2080 partition with MPI */

	if(this.values.partition[0] == "GPU_RTX2080" && this.values.mpirun_true != 0 && this.values.gpus > 0 && this.values.gpus < 2) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n##################### SLURM Head #######################\n########Auto Generated By Galaxy Cluster@VISTEC#########\n";

		if(this.inputs.single_node.checked)
			scr += "\n# set the number of nodes to single \n" + "#SBATCH --nodes=1 \n";
			
		if(this.values.num_cores > 0)
			scr += "\n# set the number of task all nodes\n" + "#SBATCH --ntasks=" + this.values.num_cores + "\n";

		if(this.values.partition.length > 0)
			scr += "\n# set partition that is destination of the job\n" + "#SBATCH --partition=qgpu_rtx2080\n";

		if(this.inputs.mem_per_core.value > 0)
			scr += "\n# set the number of memory per node\n" + "#SBATCH --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value + "\n";

		if(this.inputs.num_gpus.value > 0)
			scr += "\n# set the number of GPU\n" + "#SBATCH --gres=gpu:" + this.inputs.num_gpus.value + "\n";
		
		if(this.inputs.wallhours.value > 0)
			scr += "\n# set walltime\n" + "#SBATCH --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "\n";
		
		if(this.inputs.job_name.value != "")
			scr += "\n# set name of job\n" + "#SBATCH --job-name=" + this.inputs.job_name.value + "\n";
		
		if(this.inputs.chdir.value != "") 
			scr += "\n# set working directory\n" + "#SBATCH --chdir=\"" + this.inputs.chdir.value + "\"\n";
	
		scr += "\n########################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\nmodule load openmpi3\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n";
		scr += "\nsrun --mpi=pmix_v2 -n " + this.values.num_cores + " ./yourprogram\n\n";
		return scr;
	}
	
	/* Add SLURM script for CPU partition with no MPI */

	if(this.values.partition[0] == "CPU" && this.values.mpirun_false != 0) {
	
		var scr = "\n\n#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n##################### SLURM Head #######################\n########Auto Generated By Galaxy Cluster@VISTEC#########\n";

		if(this.inputs.single_node.checked)
			scr += "\n# set the number of nodes to single \n" + "#SBATCH --nodes=1 \n";
			
		if(this.values.num_cores > 0)
			scr += "\n# set the number of cpu per task\n" + "#SBATCH --cpus-per-task=" + this.values.num_cores + "\n";

		if(this.values.partition.length > 0)
			scr += "\n# set partition that is destination of the job\n" + "#SBATCH --partition=qcpu\n";

		if(this.inputs.mem_per_core.value > 0)
			scr += "\n# set the number of memory per node\n" + "#SBATCH --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value + "\n";

		if(this.inputs.wallhours.value > 0)
			scr += "\n# set walltime\n" + "#SBATCH --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "\n";

		if(this.inputs.job_name.value != "")
			scr += "\n# set name of job\n" + "#SBATCH --job-name=" + this.inputs.job_name.value + "\n";
		
		if(this.inputs.chdir.value != "") 
			scr += "\n# set working directory\n" + "#SBATCH --chdir=\"" + this.inputs.chdir.value + "\"\n";
	
		scr += "\n########################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";

		return scr;
	}
	
	/* Add SLURM script for CPU partition with MPI */

	if(this.values.partition[0] == "CPU" && this.values.mpirun_true != 0) {
	
	var scr = "\n\n#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n##################### SLURM Head #######################\n########Auto Generated By Galaxy Cluster@VISTEC#########\n";

		if(this.inputs.single_node.checked)
			scr += "\n# set the number of nodes to single \n" + "#SBATCH --nodes=1 \n";
			
		if(this.values.num_cores > 0)
			scr += "\n# set the number of task all nodes\n" + "#SBATCH --ntasks=" + this.values.num_cores + "\n";

		if(this.values.partition.length > 0)
			scr += "\n# set partition that is destination of the job\n" + "#SBATCH --partition=qcpu\n";

		if(this.inputs.mem_per_core.value > 0)
			scr += "\n# set the number of memory per node\n" + "#SBATCH --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value + "\n";
		
		if(this.inputs.wallhours.value > 0)
			scr += "\n# set walltime\n" + "#SBATCH --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "\n";

		if(this.inputs.job_name.value != "")
			scr += "\n# set name of job\n" + "#SBATCH --job-name=" + this.inputs.job_name.value + "\n";
		
		if(this.inputs.chdir.value != "") 
			scr += "\n# set working directory\n" + "#SBATCH --chdir=\"" + this.inputs.chdir.value + "\"\n";
	
		scr += "\n########################################################\n";
		scr += "\n# LOAD MODULES HERE\n";
		scr += "\nmodule load openmpi3\n";
		scr += "\n# INSERT CODE, AND RUN YOUR PROGRAMS HERE\n\n";
		scr += "\nsrun --mpi=pmix_v2 -n " + this.values.num_cores + " ./yourprogram\n\n";

		return scr;
	}

};

VISTECScriptGen.prototype.generateScriptSLURM2 = function () {
	this.retrieveValues();

	/* Add SLURM script for GPU_GTX1070Ti partition with no MPI */

	if(this.values.partition[0] == "GPU_GTX1070Ti" && this.values.mpirun_false != 0 && this.values.gpus > 0 && this.values.gpus < 5) {
	
		var scr2 = "\n\nsbatch";

		if(this.inputs.single_node.checked)
			scr2 += " --node=1";

		if(this.values.num_cores > 0)
			scr2 += " --cpus-per-task=" + this.values.num_cores;

		if(this.values.partition.length > 0)
			scr2 += " --partition=qgpu_gtx1070ti";

		if(this.inputs.mem_per_core.value > 0)
			scr2 += " --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.num_gpus.value > 0)
			scr2 += " --gres=gpu:" + this.inputs.num_gpus.value;

		if(this.inputs.wallhours.value > 0)
			scr2 += " --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

		if(this.inputs.job_name.value != "")
			scr2 += " --job-name=" + this.inputs.job_name.value;

		if(this.inputs.chdir.value != "")
			scr2 += " --chdir=\"" + this.inputs.chdir.value + "\"";

		scr2 += " --wrap=\"INSERT PATH TO YOUR PROGRAMS HERE\"";
		scr2 += "\n\n";

		return scr2;
	}

	/* Add SLURM script for GPU_RTX2070 partition with no MPI */

	if(this.values.partition[0] == "GPU_RTX2070" && this.values.mpirun_false != 0 && this.values.gpus > 0 && this.values.gpus < 3) {

		var scr2 = "\n\nsbatch";

		if(this.inputs.single_node.checked)
			scr2 += " --node=1";

		if(this.values.num_cores > 0)
			scr2 += " --cpus-per-task=" + this.values.num_cores;

		if(this.values.partition.length > 0)
			scr2 += " --partition=qgpu_rtx2070";

		if(this.inputs.mem_per_core.value > 0)
			scr2 += " --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.num_gpus.value > 0)
			scr2 += " --gres=gpu:" + this.inputs.num_gpus.value;

		if(this.inputs.wallhours.value > 0)
			scr2 += " --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

		if(this.inputs.job_name.value != "")
			scr2 += " --job-name=" + this.inputs.job_name.value;

		if(this.inputs.chdir.value != "")
			scr2 += " --chdir=\"" + this.inputs.chdir.value + "\"";

		scr2 += " --wrap=\"INSERT PATH TO YOUR PROGRAMS HERE\"";
		scr2 += "\n\n";

		return scr2;
	}

	/* Add SLURM script for GPU_RTX2080 partition with no MPI */

	if(this.values.partition[0] == "GPU_RTX2080" && this.values.mpirun_false != 0 && this.values.gpus > 0 && this.values.gpus < 2) {

		var scr2 = "\n\nsbatch";

		if(this.inputs.single_node.checked)
			scr2 += " --node=1";

		if(this.values.num_cores > 0)
			scr2 += " --cpus-per-task=" + this.values.num_cores;

		if(this.values.partition.length > 0)
			scr2 += " --partition=qgpu_rtx2080";

		if(this.inputs.mem_per_core.value > 0)
			scr2 += " --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.num_gpus.value > 0)
			scr2 += " --gres=gpu:" + this.inputs.num_gpus.value;

		if(this.inputs.wallhours.value > 0)
			scr2 += " --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

		if(this.inputs.job_name.value != "")
			scr2 += " --job-name=" + this.inputs.job_name.value;

		if(this.inputs.chdir.value != "")
			scr2 += " --chdir=\"" + this.inputs.chdir.value + "\"";

		scr2 += " --wrap=\"INSERT PATH TO YOUR PROGRAMS HERE\"";
		scr2 += "\n\n";

		return scr2;
	}

	/* Add SLURM script for GPU_GTX1070Ti partition with MPI */

	if(this.values.partition[0] == "GPU_GTX1070Ti" && this.values.mpirun_true != 0 && this.values.gpus > 0 && this.values.gpus < 5) {
	
		var scr2 = "\n\nmodule load openmpi3\n"
		scr2 += "\nsbatch";

		if(this.inputs.single_node.checked)
			scr2 += " --node=1";

		if(this.values.num_cores > 0)
			scr2 += " --ntasks=" + this.values.num_cores;

		if(this.values.partition.length > 0)
			scr2 += " --partition=qgpu_gtx1070ti";

		if(this.inputs.mem_per_core.value > 0)
			scr2 += " --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.num_gpus.value > 0)
			scr2 += " --gres=gpu:" + this.inputs.num_gpus.value;

		if(this.inputs.wallhours.value > 0)
			scr2 += " --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

		if(this.inputs.job_name.value != "")
			scr2 += " --job-name=" + this.inputs.job_name.value;

		if(this.inputs.chdir.value != "")
			scr2 += " --chdir=\"" + this.inputs.chdir.value + "\"";

		scr2 += " --wrap=\"mpirun -np " + this.values.num_cores + " INSERT PATH TO YOUR PROGRAMS HERE\"";
		scr2 += "\n\n";

		return scr2;
	}

	/* Add SLURM script for GPU_RTX2070 partition with MPI */

	if(this.values.partition[0] == "GPU_RTX2070" && this.values.mpirun_true != 0 && this.values.gpus > 0 && this.values.gpus < 3) {
	
		var scr2 = "\n\nmodule load openmpi3\n"
		scr2 += "\nsbatch";

		if(this.inputs.single_node.checked)
			scr2 += " --node=1";

		if(this.values.num_cores > 0)
			scr2 += " --ntasks=" + this.values.num_cores;

		if(this.values.partition.length > 0)
			scr2 += " --partition=qgpu_rtx2070";

		if(this.inputs.mem_per_core.value > 0)
			scr2 += " --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.num_gpus.value > 0)
			scr2 += " --gres=gpu:" + this.inputs.num_gpus.value;

		if(this.inputs.wallhours.value > 0)
			scr2 += " --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

		if(this.inputs.job_name.value != "")
			scr2 += " --job-name=" + this.inputs.job_name.value;

		if(this.inputs.chdir.value != "")
			scr2 += " --chdir=\"" + this.inputs.chdir.value + "\"";

		scr2 += " --wrap=\"mpirun -np " + this.values.num_cores + " INSERT PATH TO YOUR PROGRAMS HERE\"";
		scr2 += "\n\n";

		return scr2;
	}

	/* Add SLURM script for GPU_RTX2080 partition with MPI */

	if(this.values.partition[0] == "GPU_RTX2080" && this.values.mpirun_true != 0 && this.values.gpus > 0 && this.values.gpus < 2) {
	
		var scr2 = "\n\nmodule load openmpi3\n"
		scr2 += "\nsbatch";

		if(this.inputs.single_node.checked)
			scr2 += " --node=1";

		if(this.values.num_cores > 0)
			scr2 += " --ntasks=" + this.values.num_cores;

		if(this.values.partition.length > 0)
			scr2 += " --partition=qgpu_rtx2080";

		if(this.inputs.mem_per_core.value > 0)
			scr2 += " --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.num_gpus.value > 0)
			scr2 += " --gres=gpu:" + this.inputs.num_gpus.value;

		if(this.inputs.wallhours.value > 0)
			scr2 += " --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

		if(this.inputs.job_name.value != "")
			scr2 += " --job-name=" + this.inputs.job_name.value;

		if(this.inputs.chdir.value != "")
			scr2 += " --chdir=\"" + this.inputs.chdir.value + "\"";

		scr2 += " --wrap=\"mpirun -np " + this.values.num_cores + " INSERT PATH TO YOUR PROGRAMS HERE\"";
		scr2 += "\n\n";

		return scr2;
	}

	/* Add SLURM script for CPU partition with no MPI */

	if(this.values.partition[0] == "CPU" && this.values.mpirun_false != 0) {
	
		var scr2 = "\n\nsbatch";

		if(this.inputs.single_node.checked)
			scr2 += " --node=1";

		if(this.values.num_cores > 0)
			scr2 += " --cpus-per-task=" + this.values.num_cores;

		if(this.values.partition.length > 0)
			scr2 += " --partition=qcpu";

		if(this.inputs.mem_per_core.value > 0)
			scr2 += " --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.wallhours.value > 0)
			scr2 += " --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

		if(this.inputs.job_name.value != "")
			scr2 += " --job-name=" + this.inputs.job_name.value;

		if(this.inputs.chdir.value != "")
			scr2 += " --chdir=\"" + this.inputs.chdir.value + "\"";

		scr2 += " --wrap=\"INSERT PATH TO YOUR PROGRAMS HERE\"";
		scr2 += "\n\n";

		return scr2;
	}

	/* Add SLURM script for CPU partition with MPI */

	if(this.values.partition[0] == "CPU" && this.values.mpirun_true != 0) {

		var scr2 = "\n\nmodule load openmpi3\n"
		scr2 += "\nsbatch";

		if(this.inputs.single_node.checked)
			scr2 += " --node=1";

		if(this.values.num_cores > 0)
			scr2 += " --ntasks=" + this.values.num_cores;

		if(this.values.partition.length > 0)
			scr2 += " --partition=qcpu";

		if(this.inputs.mem_per_core.value > 0)
			scr2 += " --mem=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value;

		if(this.inputs.wallhours.value > 0)
			scr2 += " --time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

		if(this.inputs.job_name.value != "")
			scr2 += " --job-name=" + this.inputs.job_name.value;

		if(this.inputs.chdir.value != "")
			scr2 += " --chdir=\"" + this.inputs.chdir.value + "\"";

		scr2 += " --wrap=\"mpirun -np " + this.values.num_cores + " INSERT PATH TO YOUR PROGRAMS HERE\"";
		scr2 += "\n\n";

		return scr2;
	}
}


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

	this.jobNotesDiv = document.createElement("div");
	this.jobNotesDiv.id = "vistec_sg_jobnotes";
	this.containerDiv.appendChild(this.jobNotesDiv);
	
	var scriptHeader = document.createElement("h1");
	scriptHeader.id = "vistec_sg_script_header";
	scriptHeader.appendChild(document.createTextNode("Script for Batch Submission of Serial Jobs"));
	this.containerDiv.appendChild(scriptHeader);

	this.form = this.createForm();
	this.inputDiv.appendChild(this.form);

	this.jobScriptDiv = document.createElement("div");
	this.jobScriptDiv.id = "vistec_sg_jobscript";
	this.containerDiv.appendChild(this.jobScriptDiv);


	this.inputDiv2 = document.createElement("div");
	this.inputDiv2.id = "vistec_sg_input_container2";
	this.containerDiv2.appendChild(this.inputDiv2);

	var scriptHeader2 = document.createElement("h1");
	scriptHeader2.id = "vistec_sg_script_header2";
	scriptHeader2.appendChild(document.createTextNode("Script for Batch Submission of Single Job"));
	this.containerDiv2.appendChild(scriptHeader2);

	this.jobScriptDiv2 = document.createElement("div");
	this.jobScriptDiv2.id = "vistec_sg_jobscript2";
	this.containerDiv2.appendChild(this.jobScriptDiv2);

	this.updateJobscript();
};

VISTECScriptGen.prototype.toJobScript = function() {
	scr = this.generateScriptSLURM();		
	this.jobScriptDiv.innerHTML = "<pre>" + scr + "</pre>";
	scr2 = this.generateScriptSLURM2();
	this.jobScriptDiv2.innerHTML = "<pre>" + scr2 + "</pre>";
};
